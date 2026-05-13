import { ApiProperty } from '@nestjs/swagger';

export class MessageResponseDto {
  @ApiProperty({
    example: 'Se o e-mail existir, enviaremos um link de recuperação.',
  })
  message!: string;
}
