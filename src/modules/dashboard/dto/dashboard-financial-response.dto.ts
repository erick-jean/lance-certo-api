import { ApiProperty } from '@nestjs/swagger';

export class DashboardFinancialResponseDto {
  @ApiProperty({ example: 8 })
  totalPurchasedVehicles!: number;

  @ApiProperty({ example: 3 })
  totalSoldVehicles!: number;

  @ApiProperty({ example: 150000 })
  totalInvested!: number;

  @ApiProperty({ example: 25000 })
  totalExpenses!: number;

  @ApiProperty({ example: 210000 })
  totalSold!: number;

  @ApiProperty({ example: 35000 })
  totalProfit!: number;

  @ApiProperty({ example: 22.5, nullable: true })
  averageProfitMargin!: number | null;
}
