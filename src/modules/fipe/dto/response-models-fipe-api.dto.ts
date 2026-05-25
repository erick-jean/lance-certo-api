import { ApiProperty } from '@nestjs/swagger';

export class ResponseModelsFipeApiDto {
  @ApiProperty({ description: 'Código do modelo', example: 59 })
  code!: number;

  @ApiProperty({
    description: 'Nome do modelo',
    example: 'AMAROK CD2.0 16V/S CD2.0 16V TDI 4x2 Die',
  })
  name!: string;
}
