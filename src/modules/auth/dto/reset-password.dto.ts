import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'f0f1f2f3f4f5f6f7f8f9',
  })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ example: 'newStrongPassword123' })
  @IsString()
  @MinLength(6)
  @MaxLength(255)
  password!: string;
}
