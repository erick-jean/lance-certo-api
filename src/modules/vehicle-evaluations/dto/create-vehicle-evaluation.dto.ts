import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateVehicleEvaluationDto {
  @ApiPropertyOptional({ example: 8500, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedRepairCost?: number | null;

  @ApiPropertyOptional({ example: 2500, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  auctionFees?: number | null;

  @ApiPropertyOptional({ example: 1200, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  documentationCost?: number | null;

  @ApiPropertyOptional({ example: 1800, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  transportCost?: number | null;

  @ApiPropertyOptional({ example: 500, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  inspectionCost?: number | null;

  @ApiPropertyOptional({ example: 15, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  desiredProfitMarginPercent?: number | null;

  @ApiPropertyOptional({ example: 2, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  safetyMarginPercent?: number | null;
}
