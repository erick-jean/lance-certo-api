import { SetMetadata } from '@nestjs/common';
import { SubscriptionPlan } from '../../../generated/prisma/enums';

export const REQUIRED_PLAN_KEY = 'requiredPlan';

export type RequiredPlan = typeof SubscriptionPlan.PREMIUM;

export const RequirePlan = (plan: RequiredPlan) =>
  SetMetadata(REQUIRED_PLAN_KEY, plan);
