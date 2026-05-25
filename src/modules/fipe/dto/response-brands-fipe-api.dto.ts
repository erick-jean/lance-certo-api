import { ApiProperty } from '@nestjs/swagger';

export class ResponseBrandsFipeApiDto {
  @ApiProperty({ description: 'Código da marca', example: 59 })
  code!: number;

  @ApiProperty({ description: 'Nome da marca', example: 'Volkswagen' })
  name!: string;
}
