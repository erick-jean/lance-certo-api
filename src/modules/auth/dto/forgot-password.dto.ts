import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

const normalizeEmail = (value: unknown): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@email.com' })
  @Transform(({ value }: { value: unknown }) => normalizeEmail(value))
  @IsEmail()
  email!: string;
}
