import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

const normalizeEmail = (value: unknown): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class LoginDto {
  @ApiProperty({ example: 'user@email.com' })
  @Transform(({ value }: { value: unknown }) => normalizeEmail(value))
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;
}
