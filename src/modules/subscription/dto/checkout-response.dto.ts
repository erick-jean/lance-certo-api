import { ApiProperty } from '@nestjs/swagger';

export class CheckoutResponseDto {
  @ApiProperty({
    example: 'Checkout iniciado. Conclua o pagamento para ativar o premium.',
  })
  message!: string;

  @ApiProperty({
    example: 'http://localhost:4200/subscription/checkout?userId=uuid',
  })
  checkoutUrl!: string;
}
