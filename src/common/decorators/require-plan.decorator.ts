import { SetMetadata } from '@nestjs/common';

export const REQUIRED_PLAN_KEY = 'requiredPlan';

export type RequiredPlan = 'premium';

export const RequirePlan = (plan: RequiredPlan) =>
  SetMetadata(REQUIRED_PLAN_KEY, plan);
