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
  SubscriptionPlan,
  SubscriptionPlanStatus,
} from '../../../generated/prisma/client';
import { MercadoPagoWebhookDto } from './dto/mercado-pago-webhook.dto';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mercadoPagoService: MercadoPagoService,
  ) {}

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
    const effectivePlan = this.resolveEffectivePlan(normalizedUser);
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
      effectivePlan: this.toPublicEffectivePlan(effectivePlan),
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
    const metadata = this.sanitizeMercadoPagoMetadata(mpSubscription);
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
          plan:
            internalStatus === SubscriptionPlanStatus.NONE
              ? SubscriptionPlan.FREE
              : SubscriptionPlan.PREMIUM,
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
        plan: SubscriptionPlan.PREMIUM,
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
      plan: SubscriptionPlan.PREMIUM,
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
      cancelledAt:
        internalStatus === SubscriptionPlanStatus.CANCELLED ? new Date() : null,
      metadata: params.metadata,
    };
  }

  private sanitizeMercadoPagoMetadata(
    subscription: MercadoPagoPreapprovalResponse,
  ): Prisma.InputJsonValue {
    return {
      id: subscription.id,
      status: subscription.status,
      external_reference: subscription.external_reference ?? null,
      payer_id: this.toOptionalString(subscription.payer_id),
      collector_id: this.toOptionalString(subscription.collector_id),
      next_payment_date: subscription.next_payment_date ?? null,
      reason: subscription.reason ?? null,
      auto_recurring: {
        transaction_amount:
          subscription.auto_recurring?.transaction_amount ?? null,
        currency_id: subscription.auto_recurring?.currency_id ?? null,
        start_date: subscription.auto_recurring?.start_date ?? null,
        end_date: subscription.auto_recurring?.end_date ?? null,
      },
    };
  }

  async cancel(userId: string): Promise<SubscriptionResponseDto> {
    const user = await this.findUserSubscription(userId);
    const normalizedUser = await this.normalizeExpiredSubscription(user);

    if (normalizedUser.plan !== SubscriptionPlan.PREMIUM) {
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

    // Mercado Pago cancels renewal; local premium access remains until expiresAt.
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
          in: [
            SubscriptionPlanStatus.ACTIVE,
            SubscriptionPlanStatus.PENDING,
            SubscriptionPlanStatus.PAUSED,
          ],
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
    const statusesWithAccessUntilNextPayment: SubscriptionPlanStatus[] = [
      SubscriptionPlanStatus.ACTIVE,
      SubscriptionPlanStatus.CANCELLED,
      SubscriptionPlanStatus.PAUSED,
    ];

    if (statusesWithAccessUntilNextPayment.includes(status)) {
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
        plan: SubscriptionPlan.FREE,
        planStatus: SubscriptionPlanStatus.NONE,
        planExpiresAt: null,
      },
      select: this.subscriptionSelect,
    });
  }

  private toSubscriptionResponse(
    user: Awaited<ReturnType<SubscriptionService['findUserSubscription']>>,
  ): SubscriptionResponseDto {
    const premiumActive = isPremiumActive(user);
    const effectivePlan = this.resolveEffectivePlan(user);

    return {
      plan: user.plan,
      planStatus: user.planStatus,
      planExpiresAt: user.planExpiresAt,
      isPremiumActive: premiumActive,
      limits: PLAN_LIMITS[effectivePlan],
    };
  }

  private isSubscriptionAccessExpired(user: {
    plan: SubscriptionPlan;
    planExpiresAt: Date | null;
  }): boolean {
    return (
      user.plan === SubscriptionPlan.PREMIUM &&
      user.planExpiresAt !== null &&
      user.planExpiresAt <= new Date()
    );
  }

  private resolveEffectivePlan(user: {
    plan: SubscriptionPlan;
    planStatus: SubscriptionPlanStatus;
    planExpiresAt: Date | null;
  }): SubscriptionPlan {
    return isPremiumActive(user)
      ? SubscriptionPlan.PREMIUM
      : SubscriptionPlan.FREE;
  }

  private toPublicEffectivePlan(
    plan: SubscriptionPlan,
  ): SubscriptionUsageResponseDto['effectivePlan'] {
    return plan === SubscriptionPlan.PREMIUM ? 'premium' : 'free';
  }

  private mapMercadoPagoStatus(status: string): SubscriptionPlanStatus {
    switch (status) {
      case MERCADO_PAGO_PREAPPROVAL_STATUS.AUTHORIZED:
        return SubscriptionPlanStatus.ACTIVE;
      case MERCADO_PAGO_PREAPPROVAL_STATUS.PENDING:
        return SubscriptionPlanStatus.PENDING;
      case MERCADO_PAGO_PREAPPROVAL_STATUS.PAUSED:
        return SubscriptionPlanStatus.PAUSED;
      case MERCADO_PAGO_PREAPPROVAL_STATUS.CANCELLED:
      case MERCADO_PAGO_PREAPPROVAL_STATUS.CANCELED:
        return SubscriptionPlanStatus.CANCELLED;
      case MERCADO_PAGO_PREAPPROVAL_STATUS.REJECTED:
        return SubscriptionPlanStatus.REJECTED;
      case MERCADO_PAGO_PREAPPROVAL_STATUS.EXPIRED:
        return SubscriptionPlanStatus.EXPIRED;
      case MERCADO_PAGO_PREAPPROVAL_STATUS.NONE:
        return SubscriptionPlanStatus.NONE;
      default:
        return SubscriptionPlanStatus.PENDING;
    }
  }
}
