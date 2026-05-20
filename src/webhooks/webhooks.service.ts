import { Injectable, Logger } from '@nestjs/common';
import {
  Prisma,
  SubscriptionPlanStatus,
  User,
} from '../../generated/prisma/client';
import { PrismaService } from 'src/database/prisma.service';
import {
  MercadoPagoPreapprovalResponse,
  MercadoPagoService,
} from 'src/modules/mercado-pago/mercado-pago.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mercadoPagoService: MercadoPagoService,
  ) {}

  async handleMercadoPagoWebhook(data: {
    body: any;
    query: any;
    headers: any;
  }) {
    this.logger.log(`Webhook Mercado Pago recebido: ${JSON.stringify(data)}`);

    const preapprovalId = this.extractPreapprovalId(data.body, data.query);

    if (!preapprovalId) {
      this.logger.warn('Webhook recebido sem ID de preapproval.');
      return;
    }

    const mpSubscription =
      await this.mercadoPagoService.getPreapproval(preapprovalId);

    await this.syncSubscription(mpSubscription);
  }

  private extractPreapprovalId(body: any, query: any): string | null {
    return (
      body?.data?.id || body?.id || query?.id || query?.['data.id'] || null
    );
  }

  private async syncSubscription(
    mpSubscription: MercadoPagoPreapprovalResponse,
  ) {
    const mercadoPagoPreapprovalId = mpSubscription.id;
    const mercadoPagoStatus = mpSubscription.status;
    const externalReference = mpSubscription.external_reference;
    const payerEmail = mpSubscription.payer_email;

    let user: User | null = null;

    if (externalReference) {
      user = await this.prisma.user.findUnique({
        where: { id: externalReference },
      });
    }

    if (!user && payerEmail) {
      user = await this.prisma.user.findUnique({
        where: { email: payerEmail },
      });
    }

    if (!user) {
      this.logger.warn(
        `Usuário não encontrado. external_reference=${externalReference}, payer_email=${payerEmail}`,
      );
      return;
    }

    const internalStatus = this.mapMercadoPagoStatus(mercadoPagoStatus);
    const nextPaymentAt = mpSubscription.next_payment_date
      ? new Date(mpSubscription.next_payment_date)
      : null;

    const userUpdateData = this.getUserUpdateData(
      internalStatus,
      nextPaymentAt,
    );

    await this.prisma.$transaction([
      this.prisma.subscription.upsert({
        where: {
          mercadoPagoPreapprovalId,
        },
        create: {
          userId: user.id,
          plan: 'PREMIUM',
          status: internalStatus,
          mercadoPagoPreapprovalId,
          mercadoPagoStatus,
          mercadoPagoPayerId: mpSubscription.payer_id
            ? String(mpSubscription.payer_id)
            : null,
          mercadoPagoCollectorId: mpSubscription.collector_id
            ? String(mpSubscription.collector_id)
            : null,
          amount: mpSubscription.auto_recurring?.transaction_amount ?? 29.9,
          currency: mpSubscription.auto_recurring?.currency_id ?? 'BRL',
          reason: mpSubscription.reason,
          externalReference: mpSubscription.external_reference,
          startedAt: mpSubscription.auto_recurring?.start_date
            ? new Date(mpSubscription.auto_recurring.start_date)
            : null,
          nextPaymentAt,
          expiresAt: mpSubscription.auto_recurring?.end_date
            ? new Date(mpSubscription.auto_recurring.end_date)
            : null,
          cancelledAt: internalStatus === 'CANCELLED' ? new Date() : null,
          metadata: mpSubscription as Prisma.InputJsonValue,
        },
        update: {
          status: internalStatus,
          mercadoPagoStatus,
          nextPaymentAt,
          cancelledAt: internalStatus === 'CANCELLED' ? new Date() : undefined,
          metadata: mpSubscription as Prisma.InputJsonValue,
        },
      }),

      this.prisma.user.update({
        where: { id: user.id },
        data: userUpdateData,
      }),
    ]);
  }

  private getUserUpdateData(
    status: SubscriptionPlanStatus,
    nextPaymentAt: Date | null,
  ) {
    if (status === 'ACTIVE') {
      return {
        plan: 'PREMIUM' as const,
        planStatus: 'ACTIVE' as const,
        planExpiresAt: nextPaymentAt,
      };
    }

    if (
      status === 'CANCELLED' ||
      status === 'EXPIRED' ||
      status === 'REJECTED'
    ) {
      return {
        plan: 'FREE' as const,
        planStatus: 'NONE' as const,
        planExpiresAt: null,
      };
    }

    return {
      plan: 'PREMIUM' as const,
      planStatus: status,
      planExpiresAt: nextPaymentAt,
    };
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
      default:
        return 'PENDING';
    }
  }
}
