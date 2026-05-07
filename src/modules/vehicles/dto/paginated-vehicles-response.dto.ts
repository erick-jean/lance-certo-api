import { ApiProperty } from '@nestjs/swagger';
import { ResponseVehicleDto } from './response-vehicle.dto';

class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;

  @ApiProperty({ example: 42 })
  totalItems!: number;

  @ApiProperty({ example: 5 })
  totalPages!: number;

  @ApiProperty({ example: true })
  hasNextPage!: boolean;

  @ApiProperty({ example: false })
  hasPreviousPage!: boolean;
}

export class PaginatedVehicleResponseDto {
  @ApiProperty({ type: ResponseVehicleDto, isArray: true })
  data!: ResponseVehicleDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}
