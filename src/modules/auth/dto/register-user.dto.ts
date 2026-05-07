import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
} from 'class-validator';

const trimString = (value: unknown): unknown =>
  typeof value === 'string' ? value.trim() : value;

const normalizeEmail = (value: unknown): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class RegisterUserDto {
  @ApiProperty({ example: 'John Doe' })
  @Transform(({ value }: { value: unknown }) => trimString(value))
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  name!: string;

  @ApiProperty({ example: 'john@email.com' })
  @Transform(({ value }: { value: unknown }) => normalizeEmail(value))
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({ example: 'StrongPass123' })
  @IsString()
  @MinLength(8)
  @MaxLength(255)
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 0,
  })
  password!: string;
}
