import { ApiProperty } from '@nestjs/swagger';
import { PlanLimitsResponseDto } from './subscription-response.dto';

export class SubscriptionUsageDto {
  @ApiProperty({ example: 2 })
  vehicles!: number;

  @ApiProperty({ example: 1, nullable: true })
  remainingVehicles!: number | null;
}

export class SubscriptionUsageResponseDto {
  @ApiProperty({ example: 'free' })
  plan!: string;

  @ApiProperty({ example: 'inactive' })
  planStatus!: string;

  @ApiProperty({
    example: '2026-06-05T00:00:00.000Z',
    nullable: true,
    type: String,
    format: 'date-time',
  })
  planExpiresAt!: Date | null;

  @ApiProperty({ example: 'free', enum: ['free', 'premium'] })
  effectivePlan!: 'free' | 'premium';

  @ApiProperty({ type: PlanLimitsResponseDto })
  limits!: PlanLimitsResponseDto;

  @ApiProperty({ type: SubscriptionUsageDto })
  usage!: SubscriptionUsageDto;
}
