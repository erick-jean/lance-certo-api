import { ApiProperty } from '@nestjs/swagger';

export class MessageResponseDto {
  @ApiProperty({
    example: 'Se o email existir, enviaremos um link de recuperacao.',
  })
  message!: string;
}
