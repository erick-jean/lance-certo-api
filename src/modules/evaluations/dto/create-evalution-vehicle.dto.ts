import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class CreateEvalutionVehicleDto {
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
