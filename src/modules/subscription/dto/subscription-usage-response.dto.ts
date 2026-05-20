import { ApiProperty } from '@nestjs/swagger';
import {
  SubscriptionPlan,
  SubscriptionPlanStatus,
} from '../../../../generated/prisma/client';
import { PlanLimitsResponseDto } from './subscription-response.dto';

export class SubscriptionUsageDto {
  @ApiProperty({ example: 2 })
  vehicles!: number;

  @ApiProperty({ example: 1, nullable: true })
  remainingVehicles!: number | null;
}

export class SubscriptionUsageResponseDto {
  @ApiProperty({ example: 'FREE', enum: ['FREE', 'PREMIUM'] })
  plan!: SubscriptionPlan;

  @ApiProperty({
    example: 'NONE',
    enum: [
      'NONE',
      'PENDING',
      'ACTIVE',
      'PAUSED',
      'CANCELLED',
      'EXPIRED',
      'REJECTED',
    ],
  })
  planStatus!: SubscriptionPlanStatus;

  @ApiProperty({
    example: '2026-06-05T00:00:00.000Z',
    nullable: true,
    type: String,
    format: 'date-time',
  })
  planExpiresAt!: Date | null;

  @ApiProperty({ example: 'free', enum: ['free', 'premium'] })
  effectivePlan!: 'free' | 'premium';

  @ApiProperty({
    description:
      'Indica se o usuario ainda pode acessar recursos premium neste momento.',
    example: false,
  })
  isPremiumActive!: boolean;

  @ApiProperty({ type: PlanLimitsResponseDto })
  limits!: PlanLimitsResponseDto;

  @ApiProperty({ type: SubscriptionUsageDto })
  usage!: SubscriptionUsageDto;
}
