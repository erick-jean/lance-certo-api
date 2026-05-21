import {
  SubscriptionPlan,
  SubscriptionPlanStatus,
} from '../../../generated/prisma/enums';
import { MERCADO_PAGO_PREAPPROVAL_TOPIC } from '../mercado-pago/mercado-pago.constants';
import { SubscriptionService } from './subscription.service';

describe('SubscriptionService', () => {
  const makeService = () => {
    const prisma = {
      subscription: {
        upsert: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn(),
      },
      user: {
        update: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn(),
      },
      vehicle: {
        count: jest.fn(),
      },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    const mercadoPagoService = {
      getPreapproval: jest.fn(),
      getSubscriptionAmount: jest.fn().mockReturnValue(29.9),
      getSubscriptionCurrency: jest.fn().mockReturnValue('BRL'),
    };
    const service = new SubscriptionService(
      prisma as never,
      mercadoPagoService as never,
    );

    return { service, prisma, mercadoPagoService };
  };

  it('processa webhook do Mercado Pago e atualiza assinatura local', async () => {
    const { service, prisma, mercadoPagoService } = makeService();
    const nextPaymentDate = '2026-06-20T10:00:00.000Z';

    mercadoPagoService.getPreapproval.mockResolvedValue({
      id: 'preapproval-1',
      status: 'authorized',
      external_reference: 'user-1',
      payer_id: 123,
      collector_id: 456,
      reason: 'Assinatura Premium',
      next_payment_date: nextPaymentDate,
      auto_recurring: {
        transaction_amount: 29.9,
        currency_id: 'BRL',
        start_date: '2026-05-20T10:00:00.000Z',
        end_date: null,
      },
    });

    await expect(
      service.applyMercadoPagoWebhookEvent({
        type: MERCADO_PAGO_PREAPPROVAL_TOPIC,
        action: 'subscription_preapproval.updated',
        data: {
          id: 'preapproval-1',
        },
      }),
    ).resolves.toEqual({
      message: 'Webhook Mercado Pago processado com sucesso.',
    });

    expect(mercadoPagoService.getPreapproval).toHaveBeenCalledWith(
      'preapproval-1',
    );
    expect(prisma.subscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          mercadoPagoPreapprovalId: 'preapproval-1',
        },
        create: expect.objectContaining({
          userId: 'user-1',
          plan: SubscriptionPlan.PREMIUM,
          status: SubscriptionPlanStatus.ACTIVE,
          mercadoPagoStatus: 'authorized',
          metadata: expect.objectContaining({
            id: 'preapproval-1',
            status: 'authorized',
            external_reference: 'user-1',
          }),
        }),
        update: expect.objectContaining({
          status: SubscriptionPlanStatus.ACTIVE,
          mercadoPagoStatus: 'authorized',
        }),
      }),
    );
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        plan: SubscriptionPlan.PREMIUM,
        planStatus: SubscriptionPlanStatus.ACTIVE,
        planExpiresAt: new Date(nextPaymentDate),
      },
    });
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});
