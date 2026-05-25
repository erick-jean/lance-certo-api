import { ApiProperty } from '@nestjs/swagger';

export class ResponseFipePriceHistoryDto {
  @ApiProperty({ example: 'abril de 2024' })
  month!: string;

  @ApiProperty({ example: 'R$ 10.000,00' })
  price!: string;

  @ApiProperty({ example: '308' })
  reference!: string;
}

export class ResponseFipeInfoApiDto {
  @ApiProperty({ example: 'VW - VolksWagen' })
  brand!: string;

  @ApiProperty({ example: '005340-6' })
  codeFipe!: string;

  @ApiProperty({ example: 'Diesel' })
  fuel!: string;

  @ApiProperty({ example: 'D' })
  fuelAcronym!: string;

  @ApiProperty({ example: 'AMAROK High.CD 2.0 16V TDI 4x4 Dies. Aut' })
  model!: string;

  @ApiProperty({ example: 2014 })
  modelYear!: number;

  @ApiProperty({ example: 'R$ 10.000,00' })
  price!: string;

  @ApiProperty({ type: [ResponseFipePriceHistoryDto] })
  priceHistory!: ResponseFipePriceHistoryDto[];

  @ApiProperty({ example: 'abril de 2024' })
  referenceMonth!: string;

  @ApiProperty({ example: 1 })
  vehicleType!: number;
}
