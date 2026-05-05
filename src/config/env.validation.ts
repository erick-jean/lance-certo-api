type Env = Record<string, string | undefined>;

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_EXPIRES_DAYS',
  'APP_FRONTEND_URL',
  'REFRESH_TOKEN_COOKIE_NAME',
  'REFRESH_TOKEN_COOKIE_SECURE',
] as const;

export function validateEnv(config: Env): Env {
  for (const key of requiredEnvVars) {
    if (!config[key]) {
      throw new Error(`${key} is required`);
    }
  }

  return config;
}
