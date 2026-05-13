import { ApiProperty } from '@nestjs/swagger';

export class VehicleFinancialSummaryDto {
  @ApiProperty({ example: 'c1a2b3d4-uuid' })
  vehicleId!: string;

  @ApiProperty({ example: 18500, nullable: true })
  purchasePrice!: number | null;

  @ApiProperty({
    example: '2026-05-13T10:00:00.000Z',
    nullable: true,
    type: String,
    format: 'date-time',
  })
  purchasedAt!: Date | null;

  @ApiProperty({ example: 4200 })
  totalExpenses!: number;

  @ApiProperty({ example: 22700 })
  totalInvestment!: number;

  @ApiProperty({ example: 29000, nullable: true })
  soldPrice!: number | null;

  @ApiProperty({
    example: '2026-05-20T10:00:00.000Z',
    nullable: true,
    type: String,
    format: 'date-time',
  })
  soldAt!: Date | null;

  @ApiProperty({ example: 6300, nullable: true })
  grossProfit!: number | null;

  @ApiProperty({ example: 27.75, nullable: true })
  profitMarginPercent!: number | null;

  @ApiProperty({ example: true })
  isSold!: boolean;
}
