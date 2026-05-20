export const MERCADO_PAGO_WEBHOOK_TOPICS = [
  'subscription_preapproval',
  'subscription_authorized_payment',
] as const;

export const MERCADO_PAGO_PREAPPROVAL_TOPIC = 'subscription_preapproval';

export const MERCADO_PAGO_PREAPPROVAL_STATUS = {
  AUTHORIZED: 'authorized',
  PENDING: 'pending',
  PAUSED: 'paused',
  CANCELLED: 'cancelled',
  CANCELED: 'canceled',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
  NONE: 'none',
} as const;
