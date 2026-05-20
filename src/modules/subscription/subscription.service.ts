import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PLAN_LIMITS,
  resolveEffectivePlan,
} from 'src/common/plans/plan-limits';
import { PrismaService } from 'src/database/prisma.service';
import { CheckoutResponseDto } from './dto/checkout-response.dto';
import { SubscriptionResponseDto } from './dto/subscription-response.dto';
import { SubscriptionUsageResponseDto } from './dto/subscription-usage-response.dto';
import { SubscriptionWebhookDto } from './dto/subscription-webhook.dto';
import { MessageResponseDto } from '../auth/dto/message-response.dto';
import { MercadoPagoService } from '../mercado-pago/mercado-pago.service';
import {
  Prisma,
  SubscriptionPlanStatus,
} from '../../../generated/prisma/client';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
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
    const effectivePlan = resolveEffectivePlan(normalizedUser);
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
        userId: userId,
        payerEmail: email,
        cardTokenId,
      });

    const internalStatus = this.mapMercadoPagoStatus(mpSubscription.status);
    const isActive = internalStatus === 'ACTIVE';

    const nextPaymentAt = mpSubscription.next_payment_date
      ? new Date(mpSubscription.next_payment_date)
      : null;
    const amount = mpSubscription.auto_recurring?.transaction_amount ?? 29.9;
    const currency = mpSubscription.auto_recurring?.currency_id ?? 'BRL';
    const metadata = mpSubscription as Prisma.InputJsonValue;

    await this.prisma.$transaction([
      this.prisma.subscription.upsert({
        where: {
          mercadoPagoPreapprovalId: mpSubscription.id,
        },
        create: {
          userId: userId,
          plan: 'PREMIUM',
          status: internalStatus,
          mercadoPagoPreapprovalId: mpSubscription.id,
          mercadoPagoStatus: mpSubscription.status,
          mercadoPagoPayerId: mpSubscription.payer_id
            ? String(mpSubscription.payer_id)
            : null,
          mercadoPagoCollectorId: mpSubscription.collector_id
            ? String(mpSubscription.collector_id)
            : null,
          amount,
          currency,
          reason: mpSubscription.reason,
          externalReference: mpSubscription.external_reference,
          startedAt: mpSubscription.auto_recurring?.start_date
            ? new Date(mpSubscription.auto_recurring.start_date)
            : null,
          nextPaymentAt,
          expiresAt: mpSubscription.auto_recurring?.end_date
            ? new Date(mpSubscription.auto_recurring.end_date)
            : null,
          metadata,
        },
        update: {
          status: internalStatus,
          mercadoPagoStatus: mpSubscription.status,
          nextPaymentAt,
          metadata,
        },
      }),

      this.prisma.user.update({
        where: { id: userId },
        data: {
          plan: 'PREMIUM',
          planStatus: isActive ? 'ACTIVE' : 'PENDING',
          planExpiresAt: isActive ? nextPaymentAt : null,
        },
      }),
    ]);

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

  /**
   * Cancels subscription renewal while keeping premium access until expiration.
   */
  async cancel(userId: string): Promise<SubscriptionResponseDto> {
    const user = await this.findUserSubscription(userId);
    const normalizedUser = await this.normalizeExpiredSubscription(user);

    if (normalizedUser.plan !== 'PREMIUM') {
      return this.toSubscriptionResponse(normalizedUser);
    }

    const canceledUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        planStatus: 'CANCELLED',
        planExpiresAt: normalizedUser.planExpiresAt,
      },
      select: this.subscriptionSelect,
    });

    return this.toSubscriptionResponse(canceledUser);
  }

  /**
   * Applies a trusted payment gateway event to the user's subscription state.
   */
  async applySubscriptionWebhookEvent(
    dto: SubscriptionWebhookDto,
  ): Promise<MessageResponseDto> {
    const user = await this.findUserSubscription(dto.userId);

    switch (dto.event) {
      case 'payment_approved':
        await this.prisma.user.update({
          where: { id: dto.userId },
          data: {
            plan: 'PREMIUM',
            planStatus: 'ACTIVE',
            planExpiresAt: dto.planExpiresAt
              ? new Date(dto.planExpiresAt)
              : this.calculateDefaultPremiumExpiration(),
          },
        });
        break;
      case 'subscription_canceled':
        // Cancellation stops renewal but keeps premium access until the current expiration date.
        await this.prisma.user.update({
          where: { id: dto.userId },
          data: {
            planStatus: 'CANCELLED',
            planExpiresAt: dto.planExpiresAt
              ? new Date(dto.planExpiresAt)
              : user.planExpiresAt,
          },
        });
        break;
      case 'payment_past_due':
        await this.prisma.user.update({
          where: { id: dto.userId },
          data: {
            planStatus: 'PAUSED',
          },
        });
        break;
      case 'subscription_expired':
        await this.prisma.user.update({
          where: { id: dto.userId },
          data: {
            plan: 'FREE',
            planStatus: 'NONE',
            planExpiresAt: null,
          },
        });
        break;
    }

    return {
      message: 'Evento de assinatura processado com sucesso.',
    };
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
    const isExpired =
      user.plan === 'PREMIUM' &&
      user.planExpiresAt !== null &&
      user.planExpiresAt <= new Date();

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
    const effectivePlan = resolveEffectivePlan(user);

    return {
      plan: user.plan,
      planStatus: user.planStatus,
      planExpiresAt: user.planExpiresAt,
      limits: PLAN_LIMITS[effectivePlan],
    };
  }

  private calculateDefaultPremiumExpiration(): Date {
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);
    return expiresAt;
  }

  private mapMercadoPagoStatus(status: string): SubscriptionPlanStatus {
    switch (status) {
      case 'authorized':
        return 'ACTIVE';
      case 'pending':
        return 'PENDING';
      case 'paused':
        return 'PAUSED';
      case 'cancelled':
      case 'canceled':
        return 'CANCELLED';
      case 'rejected':
        return 'REJECTED';
      case 'expired':
        return 'EXPIRED';
      case 'none':
        return 'NONE';
      default:
        return 'PENDING';
    }
  }
}
