import { ApiProperty } from '@nestjs/swagger';

export class ResponseModelsFipeApiDto {
  @ApiProperty({ description: 'Codigo do modelo', example: '5940' })
  code!: string;

  @ApiProperty({
    description: 'Nome do modelo',
    example: 'AMAROK CD2.0 16V/S CD2.0 16V TDI 4x2 Die',
  })
  name!: string;
}
