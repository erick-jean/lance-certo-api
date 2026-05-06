import {
  AuctionType,
  FuelType,
  TransmissionType,
  VehicleStatus,
} from '../../../../generated/prisma/enums';

type DecimalLike = number | { toString(): string } | null | undefined;

type ResponseVehicleInput = Omit<
  Partial<ResponseVehicleDto>,
  'fipeValue' | 'marketValue' | 'auctionInitialBid' | 'auctionCurrentBid'
> & {
  fipeValue?: DecimalLike;
  marketValue?: DecimalLike;
  auctionInitialBid?: DecimalLike;
  auctionCurrentBid?: DecimalLike;
};

export class ResponseVehicleDto {
  id!: string;

  userId!: string;

  // Dados do veículo
  plate?: string;

  brand?: string;

  model?: string;

  version?: string | null;

  yearManufacture?: number;

  yearModel?: number;

  color?: string | null;

  fuelType!: FuelType | null;

  transmission!: TransmissionType | null;

  mileage?: number | null;

  // Valores de mercado
  fipeCode?: string | null;

  fipeValue!: number | null;

  marketValue!: number | null;

  // Informações do leilão
  auctioneer?: string | null;

  auctionType!: AuctionType | null;

  sourceUrl?: string | null;

  eventDate?: Date | null;

  city?: string | null;

  state?: string | null;

  yardAddress?: string | null;

  auctionInitialBid!: number | null;

  auctionCurrentBid!: number | null;

  // Controle
  status!: VehicleStatus;

  notes?: string | null;

  createdAt!: Date;

  updatedAt!: Date;

  constructor(vehicle: ResponseVehicleInput) {
    /**
     * Copia automaticamente todas as propriedades
     * do objeto "vehicle" para esta instância da classe.
     *
     * Exemplo:
     * vehicle.id -> this.id
     * vehicle.brand -> this.brand
     */
    Object.assign(this, vehicle);

    /**
     * Prisma retorna campos Decimal como objeto Decimal.
     * Aqui convertemos para number para a API retornar
     * valores numéricos normais em JSON.
     *
     * Se o valor for null/undefined, retorna null.
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
