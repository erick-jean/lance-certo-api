import { ApiProperty } from '@nestjs/swagger';
import { ResponseVehicleDto } from './response-vehicle.dto';

export class PaginatedVehiclesResponseDto {
  @ApiProperty({ type: [ResponseVehicleDto] })
  data!: ResponseVehicleDto[];

  @ApiProperty({ example: 42 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 3 })
  totalPages!: number;
}
