import { ApiProperty } from '@nestjs/swagger';
import {
  SubscriptionPlan,
  SubscriptionPlanStatus,
} from '../../../../generated/prisma/client';

export class PlanLimitsResponseDto {
  @ApiProperty({ example: 3, nullable: true })
  maxVehicles!: number | null;

  @ApiProperty({ example: 10 })
  maxImagesPerVehicle!: number;

  @ApiProperty({ example: true })
  canUseBasicEvaluation!: boolean;

  @ApiProperty({ example: false })
  canUseAdvancedEvaluation!: boolean;

  @ApiProperty({ example: false })
  canUseManualExpenses!: boolean;

  @ApiProperty({ example: false })
  canUseFinancial!: boolean;

  @ApiProperty({ example: false })
  canUseReports!: boolean;

  @ApiProperty({ example: false })
  canUseFinancialDashboard!: boolean;
}

export class SubscriptionResponseDto {
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
    required: false,
    nullable: true,
    type: String,
    format: 'date-time',
  })
  planExpiresAt!: Date | null;

  @ApiProperty({ type: PlanLimitsResponseDto })
  limits!: PlanLimitsResponseDto;
}
