type Env = Record<string, string | undefined>;

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_EXPIRES_DAYS',
  'APP_FRONTEND_URL',
  'REFRESH_TOKEN_COOKIE_NAME',
  'REFRESH_TOKEN_COOKIE_SECURE',
  'SWAGGER_ENABLED',
  'SUBSCRIPTION_WEBHOOK_SECRET',
] as const;

/**
 * Validates required environment variables during application startup.
 */
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

  if (!['true', 'false'].includes(config.REFRESH_TOKEN_COOKIE_SECURE ?? '')) {
    throw new Error('REFRESH_TOKEN_COOKIE_SECURE must be true or false');
  }

  if (!['true', 'false'].includes(config.SWAGGER_ENABLED ?? '')) {
    throw new Error('SWAGGER_ENABLED must be true or false');
  }

  try {
    new URL(config.APP_FRONTEND_URL ?? '');
  } catch {
    throw new Error('APP_FRONTEND_URL must be a valid URL');
  }

  return config;
}
