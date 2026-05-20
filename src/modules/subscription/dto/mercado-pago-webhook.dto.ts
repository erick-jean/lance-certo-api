import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { MERCADO_PAGO_WEBHOOK_TOPICS } from 'src/modules/mercado-pago/mercado-pago.constants';

export class MercadoPagoWebhookDataDto {
  @ApiProperty({ example: '2c938084726fca480172750000000000' })
  @IsString()
  id!: string;
}

export class MercadoPagoWebhookDto {
  @ApiPropertyOptional({ example: 12345 })
  @IsOptional()
  @IsNumber()
  id?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  live_mode?: boolean;

  @ApiProperty({
    example: 'subscription_preapproval',
    enum: MERCADO_PAGO_WEBHOOK_TOPICS,
    description: 'Tópico do evento enviado pelo Mercado Pago.',
  })
  @IsString()
  @IsIn(MERCADO_PAGO_WEBHOOK_TOPICS)
  type!: (typeof MERCADO_PAGO_WEBHOOK_TOPICS)[number];

  @ApiPropertyOptional({ example: 'subscription_preapproval.updated' })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ example: '2026-05-20T10:44:47.000-04:00' })
  @IsOptional()
  @IsDateString()
  date_created?: string;

  @ApiPropertyOptional({ example: 'v1' })
  @IsOptional()
  @IsString()
  api_version?: string;

  @ApiPropertyOptional({ example: 3412917708 })
  @IsOptional()
  @IsNumber()
  user_id?: number;

  @ApiProperty({ type: MercadoPagoWebhookDataDto })
  @IsObject()
  @ValidateNested()
  @Type(() => MercadoPagoWebhookDataDto)
  data!: MercadoPagoWebhookDataDto;
}
