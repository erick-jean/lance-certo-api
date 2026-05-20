import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSubscriptionCheckoutDto {
  @IsString()
  @IsNotEmpty()
  cardTokenId!: string;
}