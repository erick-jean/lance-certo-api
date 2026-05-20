type RawEnv = Record<string, string | undefined>;
type NodeEnv = 'development' | 'test' | 'production';

type ValidatedEnv = Record<string, unknown> & {
  NODE_ENV: NodeEnv;
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_DAYS: number;
  APP_FRONTEND_URL: string;
  REFRESH_TOKEN_COOKIE_NAME: string;
  REFRESH_TOKEN_COOKIE_SECURE: boolean;
  SWAGGER_ENABLED: boolean;
  MERCADO_PAGO_ACCESS_TOKEN: string;
  MERCADO_PAGO_PREMIUM_PLAN_ID: string;
  MERCADO_PAGO_WEBHOOK_SECRET: string;
  MERCADO_PAGO_WEBHOOK_URL: string;
  POSTGRES_PORT?: number;
  SMTP_PORT?: number;
  SMTP_SECURE?: boolean;
};

const requiredStringEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'APP_FRONTEND_URL',
  'REFRESH_TOKEN_COOKIE_NAME',
  'MERCADO_PAGO_ACCESS_TOKEN',
  'MERCADO_PAGO_PREMIUM_PLAN_ID',
  'MERCADO_PAGO_WEBHOOK_SECRET',
  'MERCADO_PAGO_WEBHOOK_URL',
] as const;

const requiredUrlEnvVars = [
  'DATABASE_URL',
  'APP_FRONTEND_URL',
  'MERCADO_PAGO_WEBHOOK_URL',
] as const;

const optionalUrlListEnvVars = ['CORS_ORIGIN'] as const;

export function validateEnv(config: RawEnv): ValidatedEnv {
  const validated = { ...config } as ValidatedEnv;

  for (const key of requiredStringEnvVars) {
    validated[key] = getRequiredString(config, key);
  }

  validated.NODE_ENV = validateNodeEnv(config.NODE_ENV);
  validated.PORT = parseOptionalPositiveInteger(config.PORT, 'PORT', 3000);
  validated.JWT_REFRESH_EXPIRES_DAYS = parseRequiredPositiveInteger(
    config.JWT_REFRESH_EXPIRES_DAYS,
    'JWT_REFRESH_EXPIRES_DAYS',
  );
  validated.REFRESH_TOKEN_COOKIE_SECURE = parseRequiredBoolean(
    config.REFRESH_TOKEN_COOKIE_SECURE,
    'REFRESH_TOKEN_COOKIE_SECURE',
  );
  validated.SWAGGER_ENABLED = parseRequiredBoolean(
    config.SWAGGER_ENABLED,
    'SWAGGER_ENABLED',
  );

  validateJwt(config);
  validateUrls(config);
  validateDockerEnv(config, validated);
  validateEmailEnv(config, validated);

  return validated;
}

function validateJwt(config: RawEnv): void {
  const jwtSecret = getRequiredString(config, 'JWT_SECRET');

  if (jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }

  if (!/^\d+[smhd]$/.test(getRequiredString(config, 'JWT_EXPIRES_IN'))) {
    throw new Error('JWT_EXPIRES_IN must use a duration like 15m, 1h or 1d');
  }
}

function validateUrls(config: RawEnv): void {
  for (const key of requiredUrlEnvVars) {
    assertValidUrl(getRequiredString(config, key), key);
  }

  for (const key of optionalUrlListEnvVars) {
    const value = config[key];

    if (!value) {
      continue;
    }

    for (const origin of value.split(',').map((item) => item.trim())) {
      assertValidUrl(origin, key);
    }
  }
}

function validateDockerEnv(config: RawEnv, validated: ValidatedEnv): void {
  if (config.POSTGRES_PORT) {
    validated.POSTGRES_PORT = parseOptionalPositiveInteger(
      config.POSTGRES_PORT,
      'POSTGRES_PORT',
    );
  }
}

function validateEmailEnv(config: RawEnv, validated: ValidatedEnv): void {
  const hasSmtpConfig = Boolean(
    config.SMTP_HOST ||
      config.SMTP_PORT ||
      config.EMAIL_FROM ||
      config.SMTP_SECURE ||
      config.SMTP_USER ||
      config.SMTP_PASSWORD,
  );
  const isProduction = validated.NODE_ENV === 'production';

  if (isProduction && !hasSmtpConfig) {
    throw new Error(
      'SMTP_HOST, SMTP_PORT and EMAIL_FROM are required in production',
    );
  }

  if (!hasSmtpConfig) {
    return;
  }

  getRequiredString(config, 'SMTP_HOST');
  getRequiredString(config, 'EMAIL_FROM');
  validated.SMTP_PORT = parseRequiredPositiveInteger(
    config.SMTP_PORT,
    'SMTP_PORT',
  );

  if (config.SMTP_SECURE) {
    validated.SMTP_SECURE = parseRequiredBoolean(
      config.SMTP_SECURE,
      'SMTP_SECURE',
    );
  }

  if (Boolean(config.SMTP_USER) !== Boolean(config.SMTP_PASSWORD)) {
    throw new Error('SMTP_USER and SMTP_PASSWORD must be provided together');
  }
}

function validateNodeEnv(value: string | undefined): NodeEnv {
  if (!value) {
    return 'development';
  }

  if (['development', 'test', 'production'].includes(value)) {
    return value as NodeEnv;
  }

  throw new Error('NODE_ENV must be development, test or production');
}

function getRequiredString(config: RawEnv, key: string): string {
  const value = config[key]?.trim();

  if (!value) {
    throw new Error(`${key} is required`);
  }

  return value;
}

function parseRequiredBoolean(
  value: string | undefined,
  key: string,
): boolean {
  if (value !== 'true' && value !== 'false') {
    throw new Error(`${key} must be true or false`);
  }

  return value === 'true';
}

function parseRequiredPositiveInteger(
  value: string | undefined,
  key: string,
): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${key} must be a positive integer`);
  }

  return parsed;
}

function parseOptionalPositiveInteger(
  value: string | undefined,
  key: string,
  defaultValue?: number,
): number {
  if (!value) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }

    throw new Error(`${key} is required`);
  }

  return parseRequiredPositiveInteger(value, key);
}

function assertValidUrl(value: string, key: string): void {
  try {
    new URL(value);
  } catch {
    throw new Error(`${key} must be a valid URL`);
  }
}
