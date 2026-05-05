import { ApiProperty } from '@nestjs/swagger';

export class SubscriptionResponseDto {
  @ApiProperty({ example: 'free', enum: ['free', 'premium'] })
  plan!: 'free' | 'premium';

  @ApiProperty({
    example: 'inactive',
    enum: ['active', 'inactive', 'canceled', 'past_due'],
  })
  planStatus!: 'active' | 'inactive' | 'canceled' | 'past_due';

  @ApiProperty({
    example: '2026-06-05T00:00:00.000Z',
    required: false,
    nullable: true,
    type: String,
    format: 'date-time',
  })
  planExpiresAt!: Date | null;
}
