import { ApiProperty } from '@nestjs/swagger';

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
  @ApiProperty({ example: 'free', enum: ['free', 'premium'] })
  plan!: 'free' | 'premium';

  @ApiProperty({
    example: 'inactive',
    enum: ['active', 'inactive', 'canceled', 'past_due'],
  })
  planStatus!: 'active' | 'inactive' | 'canceled' | 'past_due';

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
