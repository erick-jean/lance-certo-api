import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionPlan } from '../../../../generated/prisma/enums';

export class DashboardSummaryResponseDto {
  @ApiProperty({ example: 12 })
  totalVehicles!: number;

  @ApiProperty({ example: 5 })
  analyzingVehicles!: number;

  @ApiProperty({ example: 1 })
  rejectedVehicles!: number;

  @ApiProperty({ example: 4 })
  purchasedVehicles!: number;

  @ApiProperty({ example: 2 })
  soldVehicles!: number;

  @ApiProperty({ example: SubscriptionPlan.FREE, enum: SubscriptionPlan })
  plan!: SubscriptionPlan;

  @ApiProperty({ example: 3, nullable: true })
  vehicleLimit!: number | null;

  @ApiProperty({ example: 1, nullable: true })
  remainingVehicles!: number | null;
}
