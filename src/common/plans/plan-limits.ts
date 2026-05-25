import {
  SubscriptionPlan,
  SubscriptionPlanStatus,
} from '../../../generated/prisma/enums';

export const PLAN_LIMITS = {
  [SubscriptionPlan.FREE]: {
    maxVehicles: 3,
    maxImagesPerVehicle: 10,
    canUseBasicEvaluation: true,
    canUseAdvancedEvaluation: false,
    canUseManualExpenses: false,
    canUseFinancial: false,
    canUseReports: false,
    canUseFinancialDashboard: false,
  },
  [SubscriptionPlan.PREMIUM]: {
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

export type PlanName = SubscriptionPlan;

export type PlanLimits = (typeof PLAN_LIMITS)[PlanName];

export function isPremiumActive(user: {
  plan: SubscriptionPlan;
  planStatus: SubscriptionPlanStatus;
  planExpiresAt?: Date | null;
}): boolean {
  if (user.plan !== SubscriptionPlan.PREMIUM) {
    return false;
  }

  const activePremiumStatuses: SubscriptionPlanStatus[] = [
    SubscriptionPlanStatus.ACTIVE,
    SubscriptionPlanStatus.CANCELLED,
    SubscriptionPlanStatus.PAUSED,
  ];

  if (!activePremiumStatuses.includes(user.planStatus)) {
    return false;
  }

  if (!user.planExpiresAt || user.planExpiresAt <= new Date()) {
    return false;
  }

  return true;
}

export function resolveEffectivePlan(user: {
  plan: SubscriptionPlan;
  planStatus: SubscriptionPlanStatus;
  planExpiresAt?: Date | null;
}): PlanName {
  return isPremiumActive(user)
    ? SubscriptionPlan.PREMIUM
    : SubscriptionPlan.FREE;
}
