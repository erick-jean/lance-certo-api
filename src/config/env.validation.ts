type RawEnv = Record<string, string | undefined>;
type NodeEnv = 'development' | 'test' | 'production';

type ValidatedEnv = Record<string, unknown> & {
  NODE_ENV: NodeEnv;
  PORT: number;
  DATABASE_URL: string;
  DIRECT_URL?: string;
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
  FIPE_BASE_URL?: string;
  FIPE_TOKEN?: string;
  FIPE_TIMEOUT_MS: number;
  POSTGRES_PORT?: number;
  SMTP_PORT?: number;
  SMTP_SECURE?: boolean;
  STORAGE_PROVIDER?: string;
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  SUPABASE_STORAGE_BUCKET?: string;
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
const optionalUrlEnvVars = [
  'DIRECT_URL',
  'REDIS_URL',
  'FIPE_BASE_URL',
] as const;

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
  validated.FIPE_TIMEOUT_MS = parseOptionalPositiveInteger(
    config.FIPE_TIMEOUT_MS,
    'FIPE_TIMEOUT_MS',
    5000,
  );

  validateJwt(config);
  validateSwaggerEnv(validated);
  validateUrls(config);
  validateFipeEnv(config, validated);
  validateDockerEnv(config, validated);
  validateEmailEnv(config, validated);
  validateStorageEnv(config, validated);

  return validated;
}

function validateSwaggerEnv(config: ValidatedEnv): void {
  if (config.NODE_ENV === 'production' && config.SWAGGER_ENABLED) {
    throw new Error(
      'SWAGGER_ENABLED must be false when NODE_ENV is production',
    );
  }
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

  for (const key of optionalUrlEnvVars) {
    const value = config[key];

    if (!value) {
      continue;
    }

    assertValidUrl(value, key);
  }
}

function validateFipeEnv(config: RawEnv, validated: ValidatedEnv): void {
  const baseUrl = config.FIPE_BASE_URL?.trim();

  if (baseUrl) {
    validated.FIPE_BASE_URL = baseUrl;
  } else {
    delete validated.FIPE_BASE_URL;
  }

  const token = config.FIPE_TOKEN?.trim();

  if (token) {
    validated.FIPE_TOKEN = token;
  } else {
    delete validated.FIPE_TOKEN;
  }

  /*
   * FIPE_BASE_URL controls the external host contacted by the backend. In
   * production it must stay pinned to the official FIPE provider to avoid
   * turning this integration into an SSRF vector.
   */
  if (validated.NODE_ENV === 'production' && validated.FIPE_BASE_URL) {
    const url = new URL(validated.FIPE_BASE_URL);

    if (url.hostname !== 'fipe.parallelum.com.br') {
      throw new Error(
        'FIPE_BASE_URL must point to fipe.parallelum.com.br in production',
      );
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

function validateStorageEnv(config: RawEnv, validated: ValidatedEnv): void {
  const provider = config.STORAGE_PROVIDER?.trim() ?? 'local';

  if (provider !== 'local' && provider !== 'supabase') {
    throw new Error("STORAGE_PROVIDER must be 'local' or 'supabase'");
  }

  validated.STORAGE_PROVIDER = provider;

  if (provider === 'supabase') {
    validated.SUPABASE_URL = getRequiredString(config, 'SUPABASE_URL');
    assertValidUrl(validated.SUPABASE_URL as string, 'SUPABASE_URL');
    validated.SUPABASE_SERVICE_ROLE_KEY = getRequiredString(
      config,
      'SUPABASE_SERVICE_ROLE_KEY',
    );
    validated.SUPABASE_STORAGE_BUCKET = getRequiredString(
      config,
      'SUPABASE_STORAGE_BUCKET',
    );
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

function parseRequiredBoolean(value: string | undefined, key: string): boolean {
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
