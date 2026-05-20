type Env = Record<string, string | undefined>;

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'JWT_REFRESH_EXPIRES_DAYS',
  'APP_FRONTEND_URL',
  'REFRESH_TOKEN_COOKIE_NAME',
  'REFRESH_TOKEN_COOKIE_SECURE',
  'SWAGGER_ENABLED',
] as const;

const optionalUrlEnvVars = ['CORS_ORIGIN', 'MERCADO_PAGO_WEBHOOK_URL'] as const;
const optionalBooleanEnvVars = ['SMTP_SECURE'] as const;

export function validateEnv(config: Env): Env {
  for (const key of requiredEnvVars) {
    if (!config[key]) {
      throw new Error(`${key} is required`);
    }
  }

  if (config.JWT_SECRET && config.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }

  if (!Number.isFinite(Number(config.JWT_REFRESH_EXPIRES_DAYS))) {
    throw new Error('JWT_REFRESH_EXPIRES_DAYS must be a valid number');
  }

  if (Number(config.JWT_REFRESH_EXPIRES_DAYS) <= 0) {
    throw new Error('JWT_REFRESH_EXPIRES_DAYS must be greater than zero');
  }

  if (!/^\d+[smhd]$/.test(config.JWT_EXPIRES_IN ?? '')) {
    throw new Error('JWT_EXPIRES_IN must use a duration like 15m, 1h or 1d');
  }

  if (!['true', 'false'].includes(config.REFRESH_TOKEN_COOKIE_SECURE ?? '')) {
    throw new Error('REFRESH_TOKEN_COOKIE_SECURE must be true or false');
  }

  if (!['true', 'false'].includes(config.SWAGGER_ENABLED ?? '')) {
    throw new Error('SWAGGER_ENABLED must be true or false');
  }

  if (
    config.NODE_ENV &&
    !['development', 'test', 'production'].includes(config.NODE_ENV)
  ) {
    throw new Error('NODE_ENV must be development, test or production');
  }

  validateEmailEnv(config);
  validateMercadoPagoWebhookEnv(config);

  try {
    new URL(config.APP_FRONTEND_URL ?? '');
  } catch {
    throw new Error('APP_FRONTEND_URL must be a valid URL');
  }

  for (const key of optionalUrlEnvVars) {
    const value = config[key];

    if (!value) {
      continue;
    }

    for (const origin of value.split(',').map((origin) => origin.trim())) {
      try {
        new URL(origin);
      } catch {
        throw new Error(`${key} must contain valid comma-separated URLs`);
      }
    }
  }

  return config;
}

function validateEmailEnv(config: Env): void {
  const hasSmtpHost = Boolean(config.SMTP_HOST);
  const hasSmtpPort = Boolean(config.SMTP_PORT);
  const hasEmailFrom = Boolean(config.EMAIL_FROM);
  const isProduction = config.NODE_ENV === 'production';

  if (isProduction && (!hasSmtpHost || !hasSmtpPort || !hasEmailFrom)) {
    throw new Error(
      'SMTP_HOST, SMTP_PORT and EMAIL_FROM are required in production',
    );
  }

  if ((hasSmtpHost || hasSmtpPort || hasEmailFrom) && !hasSmtpPort) {
    throw new Error('SMTP_PORT is required when SMTP email is configured');
  }

  if (hasSmtpPort) {
    const port = Number(config.SMTP_PORT);

    if (!Number.isInteger(port) || port <= 0 || port > 65_535) {
      throw new Error('SMTP_PORT must be a valid TCP port');
    }
  }

  for (const key of optionalBooleanEnvVars) {
    const value = config[key];

    if (value && !['true', 'false'].includes(value)) {
      throw new Error(`${key} must be true or false`);
    }
  }

  if (Boolean(config.SMTP_USER) !== Boolean(config.SMTP_PASSWORD)) {
    throw new Error('SMTP_USER and SMTP_PASSWORD must be provided together');
  }
}

function validateMercadoPagoWebhookEnv(config: Env): void {
  if (config.NODE_ENV !== 'production') {
    return;
  }

  if (!config.MERCADO_PAGO_WEBHOOK_SECRET) {
    throw new Error('MERCADO_PAGO_WEBHOOK_SECRET is required in production');
  }
}
