import { ApiProperty } from '@nestjs/swagger';

export class ResponseYearsFipeApiDto {
  @ApiProperty({ description: 'Codigo do ano', example: '2022-3' })
  code!: string;

  @ApiProperty({ description: 'Nome do ano', example: '2022 Diesel' })
  name!: string;
}
