import { ApiProperty } from '@nestjs/swagger';

export class ResponseReferenceFipeApiDto {
  @ApiProperty({ description: 'Codigo da referencia', example: 308 })
  code!: number;

  @ApiProperty({ description: 'Mes de referencia', example: 'abril de 2024' })
  month!: string;
}
