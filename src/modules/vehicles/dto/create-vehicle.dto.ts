import { ApiProperty } from '@nestjs/swagger';
import { AuctionType, FuelType, TransmissionType, VehicleStatus } from 'generated/prisma/enums';

export class CreateVehicleDto {
  @ApiProperty({ example: 'c1a2b3d4-uuid' })
  userId!: string;

  // Dados do veículo
  @ApiProperty({ example: 'QWE1A23' })
  plate?: string;

  @ApiProperty({ example: 'Honda' })
  brand?: string;

  @ApiProperty({ example: 'Civic' })
  model?: string;

  @ApiProperty({ example: 'Touring 1.5 Turbo' })
  version?: string | null;

  @ApiProperty({ example: 2021 })
  yearManufacture?: number;

  @ApiProperty({ example: 2022 })
  yearModel?: number;

  @ApiProperty({ example: 'Preto' })
  color?: string | null;

  @ApiProperty({ example: FuelType })
  fuelType!: FuelType | null;

  @ApiProperty({ example: TransmissionType })
  transmission!: TransmissionType | null;

  @ApiProperty({ example: 45200 })
  mileage?: number | null;

  // Valores de mercado
  @ApiProperty({ example: '014082-0' })
  fipeCode?: string | null;

  @ApiProperty({ example: 145000.0 })
  fipeValue!: number | null;

  @ApiProperty({ example: 138000.0 })
  marketValue!: number | null;

  @ApiProperty({ example: 'Copart' })
  // Informações do leilão
  auctioneer?: string | null;

  @ApiProperty({ example: AuctionType })
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

  @ApiProperty({ example: VehicleStatus })
  // Controle
  status!: VehicleStatus;

  @ApiProperty({ example: 'Pequenos riscos no para-choque.' })
  notes?: string | null;
}
