import { ApiProperty } from '@nestjs/swagger';

export class ResponseFipeReferenceDto {
  @ApiProperty({ description: 'Codigo da referencia', example: '308' })
  code!: string;

  @ApiProperty({ description: 'Mes de referencia', example: 'abril de 2024' })
  month!: string;
}
