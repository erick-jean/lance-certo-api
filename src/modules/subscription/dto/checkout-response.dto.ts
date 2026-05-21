import { ApiProperty } from '@nestjs/swagger';
import {
  SubscriptionPlan,
  SubscriptionPlanStatus,
} from '../../../../generated/prisma/client';

export class CheckoutSubscriptionResponseDto {
  @ApiProperty({
    example: '2c938084726fca480172750000000000',
    description: 'ID da assinatura/preapproval no Mercado Pago.',
  })
  id!: string;

  @ApiProperty({ example: 'PREMIUM', enum: SubscriptionPlan })
  plan!: SubscriptionPlan;

  @ApiProperty({
    example: 'ACTIVE',
    enum: SubscriptionPlanStatus,
  })
  status!: SubscriptionPlanStatus;

  @ApiProperty({
    example: 'authorized',
    description: 'Status bruto retornado pelo Mercado Pago.',
  })
  mercadoPagoStatus!: string;

  @ApiProperty({
    example: '2026-06-20T10:00:00.000Z',
    nullable: true,
    type: String,
    format: 'date-time',
  })
  nextPaymentAt!: Date | null;

  @ApiProperty({ example: 29.9 })
  amount!: number;

  @ApiProperty({ example: 'BRL' })
  currency!: string;
}

export class CheckoutResponseDto {
  @ApiProperty({
    example: 'Assinatura criada com sucesso.',
  })
  message!: string;

  @ApiProperty({ type: CheckoutSubscriptionResponseDto })
  subscription!: CheckoutSubscriptionResponseDto;
}
