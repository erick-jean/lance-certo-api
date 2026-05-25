import { ApiProperty } from '@nestjs/swagger';

export class ResponseBrandsFipeApiDto {
  @ApiProperty({ description: 'Codigo da marca', example: '59' })
  code!: string;

  @ApiProperty({ description: 'Nome da marca', example: 'Volkswagen' })
  name!: string;
}
