import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
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
  VehicleDamageType,
  VehicleStatus,
  VehicleType,
} from '../../../../generated/prisma/enums';
import { normalizePlate } from 'src/common/utils/plate.util';

const trimString = (value: unknown): unknown =>
  typeof value === 'string' ? value.trim() : value;

const trimUppercaseString = (value: unknown): unknown =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

const normalizePlateValue = (value: unknown): unknown =>
  typeof value === 'string' ? normalizePlate(value) : value;

export class CreateVehicleDto {
  @ApiPropertyOptional({ example: 'QWE1A23' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => normalizePlateValue(value))
  @IsString()
  @MaxLength(10)
  plate?: string | null;

  @ApiPropertyOptional({ example: 'Honda' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => trimString(value))
  @IsString()
  @MaxLength(100)
  brand?: string | null;

  @ApiPropertyOptional({ example: 'Civic' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => trimString(value))
  @IsString()
  @MaxLength(100)
  model?: string | null;

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
  @Transform(({ value }: { value: unknown }) => trimString(value))
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

  @ApiProperty({
    enum: VehicleType,
    example: VehicleType.CAR,
  })
  @IsEnum(VehicleType)
  type!: VehicleType;

  @ApiPropertyOptional({ example: 45200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  mileage?: number | null;

  @ApiPropertyOptional({ example: '014082-0' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => trimString(value))
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
  @Transform(({ value }: { value: unknown }) => trimString(value))
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
  @Transform(({ value }: { value: unknown }) => trimString(value))
  @IsUrl()
  @MaxLength(2048)
  sourceUrl?: string | null;

  @ApiPropertyOptional({ example: '2026-05-06T17:32:44.757Z' })
  @IsOptional()
  @IsDateString()
  eventDate?: string | null;

  @ApiPropertyOptional({ example: 'Campo Grande' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => trimString(value))
  @IsString()
  @MaxLength(100)
  city?: string | null;

  @ApiPropertyOptional({ example: 'MS' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => trimUppercaseString(value))
  @IsString()
  @MaxLength(2)
  state?: string | null;

  @ApiPropertyOptional({ example: 'Av. Gury Marques, 5500' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => trimString(value))
  @IsString()
  @MaxLength(255)
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
    example: 18500,
    description: 'Valor efetivo pago no arremate.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  purchasePrice?: number | null;

  @ApiPropertyOptional({
    example: '2026-05-13T10:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  purchasedAt?: string | null;

  @ApiPropertyOptional({
    example: 29000,
    description: 'Valor efetivo da venda.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  soldPrice?: number | null;

  @ApiPropertyOptional({
    example: '2026-05-20T10:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  soldAt?: string | null;

  @ApiPropertyOptional({
    enum: VehicleDamageType,
    example: VehicleDamageType.NONE,
  })
  @IsOptional()
  @IsEnum(VehicleDamageType)
  damageType?: VehicleDamageType;

  @ApiPropertyOptional({
    enum: VehicleStatus,
    example: VehicleStatus.ANALYZING,
  })
  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;

  @ApiPropertyOptional({ example: 'Pequenos riscos no para-choque.' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => trimString(value))
  @IsString()
  @MaxLength(1000)
  notes?: string | null;
}
