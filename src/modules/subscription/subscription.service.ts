import { Injectable, NotFoundException } from '@nestjs/common';
import {
  isPremiumActive,
  PLAN_LIMITS,
} from 'src/common/plans/plan-limits';
import { PrismaService } from 'src/database/prisma.service';
import { CheckoutResponseDto } from './dto/checkout-response.dto';
import { SubscriptionResponseDto } from './dto/subscription-response.dto';
import { SubscriptionUsageResponseDto } from './dto/subscription-usage-response.dto';
import { MessageResponseDto } from '../auth/dto/message-response.dto';
import {
  MercadoPagoPreapprovalResponse,
  MercadoPagoService,
} from '../mercado-pago/mercado-pago.service';
import {
  MERCADO_PAGO_PREAPPROVAL_STATUS,
  MERCADO_PAGO_PREAPPROVAL_TOPIC,
} from '../mercado-pago/mercado-pago.constants';
import {
  Prisma,
  SubscriptionPlanStatus,
} from '../../../generated/prisma/client';
import { MercadoPagoWebhookDto } from './dto/mercado-pago-webhook.dto';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mercadoPagoService: MercadoPagoService,
  ) {}

  /**
   * Returns the user's current subscription state.
   *
   * If a premium plan is already expired, the state is normalized back to free
   * before responding.
   */
  async findCurrentSubscription(
    userId: string,
  ): Promise<SubscriptionResponseDto> {
    const user = await this.findUserSubscription(userId);
    const normalizedUser = await this.normalizeExpiredSubscription(user);

    return this.toSubscriptionResponse(normalizedUser);
  }

  async findSubscriptionUsage(
    userId: string,
  ): Promise<SubscriptionUsageResponseDto> {
    const user = await this.findUserSubscription(userId);
    const normalizedUser = await this.normalizeExpiredSubscription(user);
    const premiumActive = isPremiumActive(normalizedUser);
    const effectivePlan = premiumActive ? 'premium' : 'free';
    const limits = PLAN_LIMITS[effectivePlan];
    const vehicles = await this.prisma.vehicle.count({
      where: { userId },
    });
    const remainingVehicles =
      limits.maxVehicles === null
        ? null
        : Math.max(limits.maxVehicles - vehicles, 0);

    return {
      plan: normalizedUser.plan,
      planStatus: normalizedUser.planStatus,
      planExpiresAt: normalizedUser.planExpiresAt,
      isPremiumActive: premiumActive,
      effectivePlan,
      limits,
      usage: {
        vehicles,
        remainingVehicles,
      },
    };
  }

  async createCheckout(
    userId: string,
    email: string,
    cardTokenId: string,
  ): Promise<CheckoutResponseDto> {
    const mpSubscription =
      await this.mercadoPagoService.createPreapprovalSubscription({
        userId,
        payerEmail: email,
        cardTokenId,
      });

    await this.syncMercadoPagoPreapproval(mpSubscription, userId);

    return this.toCheckoutResponse(mpSubscription);
  }

  async applyMercadoPagoWebhookEvent(
    dto: MercadoPagoWebhookDto,
  ): Promise<MessageResponseDto> {
    if (dto.type !== MERCADO_PAGO_PREAPPROVAL_TOPIC) {
      return {
        message: `Evento Mercado Pago recebido sem processamento: ${dto.type}.`,
      };
    }

    /**
     * Mercado Pago webhooks are intentionally lightweight. The trusted source
     * for local persistence is the current preapproval fetched from their API.
     */
    const mpSubscription = await this.mercadoPagoService.getPreapproval(
      dto.data.id,
    );

    await this.syncMercadoPagoPreapproval(mpSubscription);

    return {
      message: 'Webhook Mercado Pago processado com sucesso.',
    };
  }

  private async syncMercadoPagoPreapproval(
    mpSubscription: MercadoPagoPreapprovalResponse,
    fallbackUserId?: string,
  ): Promise<void> {
    const internalStatus = this.mapMercadoPagoStatus(mpSubscription.status);
    const nextPaymentAt = this.toNullableDate(mpSubscription.next_payment_date);
    const amount =
      this.mercadoPagoService.getSubscriptionAmount(mpSubscription);
    const currency =
      this.mercadoPagoService.getSubscriptionCurrency(mpSubscription);
    const metadata = mpSubscription as Prisma.InputJsonValue;
    const userId =
      this.resolveMercadoPagoExternalReference(mpSubscription) ??
      fallbackUserId ??
      (await this.findUserIdByMercadoPagoPreapprovalId(mpSubscription.id));

    if (!userId) {
      throw new NotFoundException(
        'Usuario da assinatura Mercado Pago nao encontrado.',
      );
    }

    const subscriptionData = this.buildSubscriptionPersistenceData({
      mpSubscription,
      userId,
      internalStatus,
      nextPaymentAt,
      amount,
      currency,
      metadata,
    });

    await this.prisma.$transaction([
      this.prisma.subscription.upsert({
        where: {
          mercadoPagoPreapprovalId: mpSubscription.id,
        },
        create: subscriptionData,
        update: subscriptionData,
      }),

      this.prisma.user.update({
        where: { id: userId },
        data: {
          plan: internalStatus === 'NONE' ? 'FREE' : 'PREMIUM',
          planStatus: internalStatus,
          planExpiresAt: this.resolvePlanExpiresAt(
            internalStatus,
            nextPaymentAt,
          ),
        },
      }),
    ]);
  }

  private toCheckoutResponse(
    mpSubscription: MercadoPagoPreapprovalResponse,
  ): CheckoutResponseDto {
    const internalStatus = this.mapMercadoPagoStatus(mpSubscription.status);
    const nextPaymentAt = this.toNullableDate(mpSubscription.next_payment_date);
    const amount =
      this.mercadoPagoService.getSubscriptionAmount(mpSubscription);
    const currency =
      this.mercadoPagoService.getSubscriptionCurrency(mpSubscription);

    return {
      message: 'Assinatura criada com sucesso.',
      subscription: {
        id: mpSubscription.id,
        plan: 'PREMIUM',
        status: internalStatus,
        mercadoPagoStatus: mpSubscription.status,
        nextPaymentAt,
        amount,
        currency,
      },
    };
  }

  private buildSubscriptionPersistenceData(params: {
    mpSubscription: MercadoPagoPreapprovalResponse;
    userId: string;
    internalStatus: SubscriptionPlanStatus;
    nextPaymentAt: Date | null;
    amount: number;
    currency: string;
    metadata: Prisma.InputJsonValue;
  }): Prisma.SubscriptionUncheckedCreateInput {
    const { mpSubscription, internalStatus } = params;

    return {
      userId: params.userId,
      plan: 'PREMIUM',
      status: internalStatus,
      mercadoPagoPreapprovalId: mpSubscription.id,
      mercadoPagoStatus: mpSubscription.status,
      mercadoPagoPayerId: this.toOptionalString(mpSubscription.payer_id),
      mercadoPagoCollectorId: this.toOptionalString(
        mpSubscription.collector_id,
      ),
      amount: params.amount,
      currency: params.currency,
      reason: mpSubscription.reason,
      externalReference: mpSubscription.external_reference,
      startedAt: this.toNullableDate(mpSubscription.auto_recurring?.start_date),
      nextPaymentAt: params.nextPaymentAt,
      expiresAt: this.toNullableDate(mpSubscription.auto_recurring?.end_date),
      cancelledAt: internalStatus === 'CANCELLED' ? new Date() : null,
      metadata: params.metadata,
    };
  }

  /**
   * Cancels subscription renewal while keeping premium access until expiration.
   */
  async cancel(userId: string): Promise<SubscriptionResponseDto> {
    const user = await this.findUserSubscription(userId);
    const normalizedUser = await this.normalizeExpiredSubscription(user);

    if (normalizedUser.plan !== 'PREMIUM') {
      return this.toSubscriptionResponse(normalizedUser);
    }

    const subscription =
      await this.findCancelableMercadoPagoSubscription(userId);

    if (!subscription?.mercadoPagoPreapprovalId) {
      throw new NotFoundException(
        'Assinatura Mercado Pago nao encontrada para cancelamento.',
      );
    }

    const cancelledSubscription =
      await this.mercadoPagoService.cancelPreapproval(
        subscription.mercadoPagoPreapprovalId,
      );

    await this.syncMercadoPagoPreapproval(cancelledSubscription, userId);

    const canceledUser = await this.findUserSubscription(userId);

    return this.toSubscriptionResponse(canceledUser);
  }

  private resolveMercadoPagoExternalReference(
    mpSubscription: MercadoPagoPreapprovalResponse,
  ): string | undefined {
    return typeof mpSubscription.external_reference === 'string'
      ? mpSubscription.external_reference
      : undefined;
  }

  private async findUserIdByMercadoPagoPreapprovalId(
    preapprovalId: string,
  ): Promise<string | undefined> {
    const subscription = await this.prisma.subscription.findUnique({
      where: {
        mercadoPagoPreapprovalId: preapprovalId,
      },
      select: {
        userId: true,
      },
    });

    return subscription?.userId;
  }

  private async findCancelableMercadoPagoSubscription(userId: string) {
    return this.prisma.subscription.findFirst({
      where: {
        userId,
        mercadoPagoPreapprovalId: {
          not: null,
        },
        status: {
          in: ['ACTIVE', 'PENDING', 'PAUSED'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        mercadoPagoPreapprovalId: true,
      },
    });
  }

  private resolvePlanExpiresAt(
    status: SubscriptionPlanStatus,
    nextPaymentAt: Date | null,
  ): Date | null {
    if (['ACTIVE', 'CANCELLED', 'PAUSED'].includes(status)) {
      return nextPaymentAt;
    }

    return null;
  }

  private toNullableDate(value: string | null | undefined): Date | null {
    return value ? new Date(value) : null;
  }

  private toOptionalString(
    value: number | string | null | undefined,
  ): string | null {
    return value === null || value === undefined ? null : String(value);
  }

  private readonly subscriptionSelect = {
    id: true,
    plan: true,
    planStatus: true,
    planExpiresAt: true,
  } as const;

  private async findUserSubscription(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: this.subscriptionSelect,
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return user;
  }

  private async normalizeExpiredSubscription(
    user: Awaited<ReturnType<SubscriptionService['findUserSubscription']>>,
  ) {
    const isExpired = this.isSubscriptionAccessExpired(user);

    if (!isExpired) {
      return user;
    }

    return this.prisma.user.update({
      where: { id: user.id },
      data: {
        plan: 'FREE',
        planStatus: 'NONE',
        planExpiresAt: null,
      },
      select: this.subscriptionSelect,
    });
  }

  private toSubscriptionResponse(
    user: Awaited<ReturnType<SubscriptionService['findUserSubscription']>>,
  ): SubscriptionResponseDto {
    const premiumActive = isPremiumActive(user);
    const effectivePlan = premiumActive ? 'premium' : 'free';

    return {
      plan: user.plan,
      planStatus: user.planStatus,
      planExpiresAt: user.planExpiresAt,
      isPremiumActive: premiumActive,
      limits: PLAN_LIMITS[effectivePlan],
    };
  }

  private isSubscriptionAccessExpired(user: {
    plan: string;
    planExpiresAt: Date | null;
  }): boolean {
    return (
      user.plan === 'PREMIUM' &&
      user.planExpiresAt !== null &&
      user.planExpiresAt <= new Date()
    );
  }

  private mapMercadoPagoStatus(status: string): SubscriptionPlanStatus {
    switch (status) {
      case MERCADO_PAGO_PREAPPROVAL_STATUS.AUTHORIZED:
        return 'ACTIVE';
      case MERCADO_PAGO_PREAPPROVAL_STATUS.PENDING:
        return 'PENDING';
      case MERCADO_PAGO_PREAPPROVAL_STATUS.PAUSED:
        return 'PAUSED';
      case MERCADO_PAGO_PREAPPROVAL_STATUS.CANCELLED:
      case MERCADO_PAGO_PREAPPROVAL_STATUS.CANCELED:
        return 'CANCELLED';
      case MERCADO_PAGO_PREAPPROVAL_STATUS.REJECTED:
        return 'REJECTED';
      case MERCADO_PAGO_PREAPPROVAL_STATUS.EXPIRED:
        return 'EXPIRED';
      case MERCADO_PAGO_PREAPPROVAL_STATUS.NONE:
        return 'NONE';
      default:
        return 'PENDING';
    }
  }
}
