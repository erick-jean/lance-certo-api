import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty({ example: 'free' })
  plan!: string;

  @ApiProperty({ example: 3, nullable: true })
  vehicleLimit!: number | null;

  @ApiProperty({ example: 1, nullable: true })
  remainingVehicles!: number | null;
}
