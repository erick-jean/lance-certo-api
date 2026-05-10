import { ApiProperty } from '@nestjs/swagger';
import { VehicleType } from 'generated/prisma/enums';

export class ResponseChecklistTemplateDto {
  @ApiProperty({ example: 'c1a2b3d4-uuid' })
  id!: string;

  @ApiProperty({ example: 'Checklist padrão carro' })
  name!: string;

  @ApiProperty({
    enum: VehicleType,
    example: VehicleType.CAR,
  })
  vehicleType!: VehicleType;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({
    example: 15,
    required: false,
  })
  totalItems?: number;

  @ApiProperty({ example: '2026-05-06T17:32:44.757Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-05-06T17:32:44.757Z' })
  updatedAt!: Date;
}
