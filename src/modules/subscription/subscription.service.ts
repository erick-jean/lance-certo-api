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

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Returns the user's current subscription state.
   *
   * If a premium plan is already expired, the state is normalized back to free
   * before responding.
   */
  async findCurrent(userId: string): Promise<SubscriptionResponseDto> {
    const user = await this.findUserSubscription(userId);
    const normalizedUser = await this.normalizeExpiredSubscription(user);

    return this.toSubscriptionResponse(normalizedUser);
  }

  async findUsage(userId: string): Promise<SubscriptionUsageResponseDto> {
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

  /**
   * Starts a checkout flow for the authenticated user.
   *
   * This method returns a URL placeholder that can later be replaced by a real
   * payment gateway session URL.
   */
  async checkout(userId: string): Promise<CheckoutResponseDto> {
    await this.findUserSubscription(userId);

    const frontendUrl =
      this.configService.get<string>('APP_FRONTEND_URL') ??
      'http://localhost:4200';
    const checkoutUrl = `${frontendUrl.replace(
      /\/$/,
      '',
    )}/subscription/checkout?userId=${userId}`;

    return {
      message: 'Checkout iniciado. Conclua o pagamento para ativar o premium.',
      checkoutUrl,
    };
  }

  /**
   * Cancels subscription renewal while keeping premium access until expiration.
   */
  async cancel(userId: string): Promise<SubscriptionResponseDto> {
    const user = await this.findUserSubscription(userId);
    const normalizedUser = await this.normalizeExpiredSubscription(user);

    if (normalizedUser.plan !== 'premium') {
      return this.toSubscriptionResponse(normalizedUser);
    }

    const canceledUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        planStatus: 'canceled',
        planExpiresAt: normalizedUser.planExpiresAt ?? new Date(),
      },
      select: this.subscriptionSelect,
    });

    return this.toSubscriptionResponse(canceledUser);
  }

  /**
   * Applies a trusted payment gateway event to the user's subscription state.
   */
  async handleWebhook(
    dto: SubscriptionWebhookDto,
  ): Promise<MessageResponseDto> {
    await this.findUserSubscription(dto.userId);

    const planExpiresAt = dto.planExpiresAt
      ? new Date(dto.planExpiresAt)
      : this.getDefaultPremiumExpiration();

    switch (dto.event) {
      case 'payment_approved':
        await this.prisma.user.update({
          where: { id: dto.userId },
          data: {
            plan: 'premium',
            planStatus: 'active',
            planExpiresAt,
          },
        });
        break;
      case 'subscription_canceled':
        await this.prisma.user.update({
          where: { id: dto.userId },
          data: {
            planStatus: 'canceled',
            planExpiresAt,
          },
        });
        break;
      case 'payment_past_due':
        await this.prisma.user.update({
          where: { id: dto.userId },
          data: {
            planStatus: 'past_due',
          },
        });
        break;
      case 'subscription_expired':
        await this.prisma.user.update({
          where: { id: dto.userId },
          data: {
            plan: 'free',
            planStatus: 'inactive',
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
      user.plan === 'premium' &&
      user.planExpiresAt !== null &&
      user.planExpiresAt <= new Date();

    if (!isExpired) {
      return user;
    }

    return this.prisma.user.update({
      where: { id: user.id },
      data: {
        plan: 'free',
        planStatus: 'inactive',
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

  private getDefaultPremiumExpiration(): Date {
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);
    return expiresAt;
  }
}
