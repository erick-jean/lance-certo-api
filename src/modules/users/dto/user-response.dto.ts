import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: 'c1a2b3d4-uuid' })
  id!: string;

  @ApiProperty({ example: 'User' })
  name!: string;

  @ApiProperty({ example: 'user@email.com' })
  email!: string;

  @ApiProperty({ example: 'user' })
  role!: string;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({
    example: '2026-01-01T00:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  createdAt!: Date;

  @ApiProperty({
    example: '2026-01-01T00:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  updatedAt!: Date;

  @ApiProperty({
    example: '2026-01-02T10:00:00.000Z',
    required: false,
    nullable: true,
    type: String,
    format: 'date-time',
  })
  lastLogin?: Date | null;
}
