import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

const subscriptionWebhookEvents = [
  'payment_approved',
  'subscription_canceled',
  'payment_past_due',
  'subscription_expired',
] as const;

export class SubscriptionWebhookDto {
  @ApiProperty({
    example: 'payment_approved',
    enum: subscriptionWebhookEvents,
  })
  @IsString()
  @IsIn(subscriptionWebhookEvents)
  event!: (typeof subscriptionWebhookEvents)[number];

  @ApiProperty({ example: 'c1a2b3d4-uuid' })
  @IsUUID()
  userId!: string;

  @ApiProperty({
    example: '2026-06-05T00:00:00.000Z',
    required: false,
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  planExpiresAt?: string;
}
