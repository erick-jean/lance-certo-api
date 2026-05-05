type Env = Record<string, string | undefined>;

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'APP_FRONTEND_URL',
] as const;

export function validateEnv(config: Env): Env {
  for (const key of requiredEnvVars) {
    if (!config[key]) {
      throw new Error(`${key} is required`);
    }
  }

  return config;
}
