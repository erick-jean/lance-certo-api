import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterUserDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  name!: string;

  @ApiProperty({ example: 'john@email.com' })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(6)
  @MaxLength(255)
  password!: string;
}
