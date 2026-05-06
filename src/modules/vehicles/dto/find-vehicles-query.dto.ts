import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { VehicleStatus } from '../../../../generated/prisma/enums';

export class FindVehiclesQueryDto {
  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @ApiPropertyOptional({
    example: 'ANALYZING',
    enum: ['ANALYZING', 'REJECTED', 'PURCHASED', 'SOLD'],
  })
  @IsOptional()
  @IsIn(Object.values(VehicleStatus))
  status?: VehicleStatus;

  @ApiPropertyOptional({ example: 'Honda' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ example: 'Civic' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ example: 'QWE1A23' })
  @IsOptional()
  @IsString()
  plate?: string;
}
