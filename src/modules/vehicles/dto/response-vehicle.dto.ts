import { ApiProperty } from '@nestjs/swagger';
import {
  AuctionType,
  FuelType,
  TransmissionType,
  VehicleDamageType,
  VehicleStatus,
  VehicleType,
} from '../../../../generated/prisma/enums';
import { IsEnum, IsOptional } from 'class-validator';

type DecimalLike = number | { toString(): string } | null | undefined;

type ResponseVehicleInput = {
  id?: string | null;
  userId?: string | null;
  plate?: string | null;
  brand?: string | null;
  model?: string | null;
  version?: string | null;
  yearManufacture?: number | null;
  yearModel?: number | null;
  color?: string | null;
  fuelType?: FuelType | null;
  transmission?: TransmissionType | null;
  type?: VehicleType;
  mileage?: number | null;
  fipeCode?: string | null;
  fipeValue?: DecimalLike;
  marketValue?: DecimalLike;
  auctioneer?: string | null;
  auctionType?: AuctionType | null;
  sourceUrl?: string | null;
  eventDate?: Date | null;
  city?: string | null;
  state?: string | null;
  yardAddress?: string | null;
  auctionInitialBid?: DecimalLike;
  auctionCurrentBid?: DecimalLike;
  status?: VehicleStatus | null;
  notes?: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

export class ResponseVehicleDto {
  @ApiProperty({ example: 'c1a2b3d4-uuid' })
  id!: string;

  @ApiProperty({ example: 'c1a2b3d4-uuid' })
  userId!: string;

  @ApiProperty({ example: 'QWE1A23' })
  plate?: string | null;

  @ApiProperty({ example: 'Honda' })
  brand?: string | null;

  @ApiProperty({ example: 'Civic' })
  model?: string | null;

  @ApiProperty({ example: 'Touring 1.5 Turbo' })
  version?: string | null;

  @ApiProperty({ example: 2021 })
  yearManufacture?: number | null;

  @ApiProperty({ example: 2022 })
  yearModel?: number | null;

  @ApiProperty({ example: 'Preto' })
  color?: string | null;

  @ApiProperty({
    enum: FuelType,
    example: FuelType.FLEX,
    nullable: true,
  })
  fuelType!: FuelType | null;

  @ApiProperty({
    enum: TransmissionType,
    example: TransmissionType.AUTOMATIC,
    nullable: true,
  })
  transmission!: TransmissionType | null;

  @ApiProperty({
    enum: VehicleType,
    example: VehicleType.CAR,
  })
  type!: VehicleType;

  @ApiProperty({ example: 45200 })
  mileage?: number | null;

  @ApiProperty({ example: '014082-0' })
  fipeCode?: string | null;

  @ApiProperty({ example: 145000.0 })
  fipeValue!: number | null;

  @ApiProperty({ example: 138000.0 })
  marketValue!: number | null;

  @ApiProperty({ example: 'Copart' })
  auctioneer?: string | null;

  @ApiProperty({
    enum: AuctionType,
    example: AuctionType.EXTRAJUDICIAL,
    nullable: true,
  })
  auctionType!: AuctionType | null;

  @ApiProperty({ example: 'https://copart.com/lote/123' })
  sourceUrl?: string | null;

  @ApiProperty({ example: '2026-05-06 17:32:44.757' })
  eventDate?: Date | null;

  @ApiProperty({ example: 'Campo Grande' })
  city?: string | null;

  @ApiProperty({ example: 'MS' })
  state?: string | null;

  @ApiProperty({ example: 'Av. Gury Marques, 5500' })
  yardAddress?: string | null;

  @ApiProperty({ example: 85000.0 })
  auctionInitialBid!: number | null;

  @ApiProperty({ example: 92000.0 })
  auctionCurrentBid!: number | null;

  @ApiProperty({
    enum: VehicleDamageType,
    example: VehicleDamageType.NONE,
  })
  @IsOptional()
  @IsEnum(VehicleDamageType)
  damageType?: VehicleDamageType;

  @ApiProperty({
    enum: VehicleStatus,
    example: VehicleStatus.ANALYZING,
  })
  status!: VehicleStatus | null;

  @ApiProperty({ example: 'Pequenos riscos no para-choque.' })
  notes?: string | null;

  @ApiProperty({ example: '2026-05-06 17:32:44.778' })
  createdAt!: Date | null;

  @ApiProperty({ example: '2026-05-06 17:32:44.778' })
  updatedAt!: Date | null;

  constructor(vehicle: ResponseVehicleInput) {
    /**
     * Copying first preserves the Prisma shape, then Decimal fields are
     * normalized for JSON responses.
     */
    Object.assign(this, vehicle);

    /**
     * Prisma Decimal values are converted to numbers for API responses.
     */
    this.fipeValue = this.toNullableNumber(vehicle.fipeValue);

    this.marketValue = this.toNullableNumber(vehicle.marketValue);

    this.auctionInitialBid = this.toNullableNumber(vehicle.auctionInitialBid);

    this.auctionCurrentBid = this.toNullableNumber(vehicle.auctionCurrentBid);
  }

  private toNullableNumber(value: DecimalLike): number | null {
    return value === null || value === undefined ? null : Number(value);
  }
}
