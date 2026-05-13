import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, Min } from 'class-validator';

export class SellVehicleDto {
  @ApiProperty({
    example: 29000,
    description: 'Valor efetivo da venda.',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  soldPrice!: number;

  @ApiPropertyOptional({
    example: '2026-05-20T10:00:00.000Z',
    type: String,
    format: 'date-time',
    description: 'Data da venda. Se não enviada, usar data atual.',
  })
  @IsOptional()
  @IsDateString()
  soldAt?: string;
}
