import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { VehicleStatus } from '../../../../generated/prisma/enums';
import { normalizePlate } from 'src/common/utils/plate.util';

const trimString = (value: unknown): unknown =>
  typeof value === 'string' ? value.trim() : value;

const normalizePlateValue = (value: unknown): unknown =>
  typeof value === 'string' ? normalizePlate(value) : value;

export class FindVehiclesQueryDto {
  @ApiPropertyOptional({
    example: 1,
    minimum: 1,
    description: 'Número da página.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({
    example: 10,
    minimum: 1,
    maximum: 100,
    description: 'Quantidade de itens por página (máximo 100).',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 10;

  @ApiPropertyOptional({
    enum: VehicleStatus,
    example: VehicleStatus.ANALYZING,
  })
  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;

  @ApiPropertyOptional({ example: 'Honda' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => trimString(value))
  @IsString()
  @MaxLength(100)
  brand?: string;

  @ApiPropertyOptional({ example: 'Civic' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => trimString(value))
  @IsString()
  @MaxLength(100)
  model?: string;

  @ApiPropertyOptional({ example: 'QWE1A23' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => normalizePlateValue(value))
  @IsString()
  @MaxLength(10)
  plate?: string;
}
