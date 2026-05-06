import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';
import {
  AuctionType,
  FuelType,
  TransmissionType,
  VehicleStatus,
} from '../../../../generated/prisma/enums';

export class CreateVehicleDto {
  @ApiPropertyOptional({ example: 'QWE1A23' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  plate?: string | null;

  @ApiPropertyOptional({ example: 'Honda' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  brand?: string | null;

  @ApiPropertyOptional({ example: 'Civic' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  model?: string | null;

  @ApiPropertyOptional({ example: 'Touring 1.5 Turbo' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  version?: string | null;

  @ApiPropertyOptional({ example: 2021 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  yearManufacture?: number | null;

  @ApiPropertyOptional({ example: 2022 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  yearModel?: number | null;

  @ApiPropertyOptional({ example: 'Preto' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  color?: string | null;

  @ApiPropertyOptional({
    enum: FuelType,
    example: FuelType.FLEX,
    nullable: true,
  })
  @IsOptional()
  @IsEnum(FuelType)
  fuelType?: FuelType | null;

  @ApiPropertyOptional({
    enum: TransmissionType,
    example: TransmissionType.AUTOMATIC,
    nullable: true,
  })
  @IsOptional()
  @IsEnum(TransmissionType)
  transmission?: TransmissionType | null;

  @ApiPropertyOptional({ example: 45200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  mileage?: number | null;

  @ApiPropertyOptional({ example: '014082-0' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  fipeCode?: string | null;

  @ApiPropertyOptional({ example: 145000.0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  fipeValue?: number | null;

  @ApiPropertyOptional({ example: 138000.0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  marketValue?: number | null;

  @ApiPropertyOptional({ example: 'Copart' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  auctioneer?: string | null;

  @ApiPropertyOptional({
    enum: AuctionType,
    example: AuctionType.EXTRAJUDICIAL,
    nullable: true,
  })
  @IsOptional()
  @IsEnum(AuctionType)
  auctionType?: AuctionType | null;

  @ApiPropertyOptional({ example: 'https://copart.com/lote/123' })
  @IsOptional()
  @IsUrl()
  sourceUrl?: string | null;

  @ApiPropertyOptional({ example: '2026-05-06T17:32:44.757Z' })
  @IsOptional()
  @IsDateString()
  eventDate?: string | null;

  @ApiPropertyOptional({ example: 'Campo Grande' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string | null;

  @ApiPropertyOptional({ example: 'MS' })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  state?: string | null;

  @ApiPropertyOptional({ example: 'Av. Gury Marques, 5500' })
  @IsOptional()
  @IsString()
  yardAddress?: string | null;

  @ApiPropertyOptional({ example: 85000.0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  auctionInitialBid?: number | null;

  @ApiPropertyOptional({ example: 92000.0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  auctionCurrentBid?: number | null;

  @ApiPropertyOptional({
    enum: VehicleStatus,
    example: VehicleStatus.ANALYZING,
  })
  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;

  @ApiPropertyOptional({ example: 'Pequenos riscos no para-choque.' })
  @IsOptional()
  @IsString()
  notes?: string | null;
}
