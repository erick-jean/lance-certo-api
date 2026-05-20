import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, Min } from 'class-validator';

export class PurchaseVehicleDto {
  @ApiProperty({
    example: 18500,
    description: 'Valor efetivo pago no arremate.',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  purchasePrice!: number;

  @ApiPropertyOptional({
    example: '2026-05-13T10:00:00.000Z',
    type: String,
    format: 'date-time',
    description: 'Data do arremate. Se não enviada, usa a data atual.',
  })
  @IsOptional()
  @IsDateString()
  purchasedAt?: string;
}
