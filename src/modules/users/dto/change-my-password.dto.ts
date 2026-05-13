import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ChangeMyPasswordDto {
  @ApiProperty({ example: 'CurrentPass123' })
  @IsString()
  @MinLength(6)
  @MaxLength(255)
  currentPassword!: string;

  @ApiProperty({ example: 'NewStrongPass123' })
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
  newPassword!: string;

  @ApiPropertyOptional({ example: 'NewStrongPass123' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(255)
  confirmPassword?: string;
}
