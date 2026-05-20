import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateCheckoutDto {
  @ApiProperty({
    example: 'e3ed6f098462036dd2cbabe314b9de2a',
    description:
      'Token do cartão gerado no frontend com MercadoPago.js/CardForm.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  cardTokenId!: string;
}
