export const PLAN_LIMITS = {
  free: {
    maxVehicles: 3,
    maxImagesPerVehicle: 10,
    canUseBasicEvaluation: true,
    canUseAdvancedEvaluation: false,
    canUseManualExpenses: false,
    canUseFinancial: false,
    canUseReports: false,
    canUseFinancialDashboard: false,
  },
  premium: {
    maxVehicles: null,
    maxImagesPerVehicle: 10,
    canUseBasicEvaluation: true,
    canUseAdvancedEvaluation: true,
    canUseManualExpenses: true,
    canUseFinancial: true,
    canUseReports: true,
    canUseFinancialDashboard: true,
  },
} as const;

export type PlanName = keyof typeof PLAN_LIMITS;

export type PlanLimits = (typeof PLAN_LIMITS)[PlanName];

export function isPremiumActive(user: {
  plan: string;
  planStatus: string;
  planExpiresAt?: Date | null;
}): boolean {
  if (user.plan !== 'premium') {
    return false;
  }

  if (user.planStatus !== 'active') {
    return false;
  }

  if (user.planExpiresAt && user.planExpiresAt <= new Date()) {
    return false;
  }

  return true;
}

export function resolveEffectivePlan(user: {
  plan: string;
  planStatus: string;
  planExpiresAt?: Date | null;
}): PlanName {
  return isPremiumActive(user) ? 'premium' : 'free';
}
