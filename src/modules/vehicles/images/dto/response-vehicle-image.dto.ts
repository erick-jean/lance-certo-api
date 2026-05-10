import { ApiProperty } from '@nestjs/swagger';

type VehicleImageResponseInput = {
  id: string;
  vehicleId: string;
  url: string;
  filename: string;
  mimetype: string;
  size: number;
  createdAt: Date;
};

export class VehicleImageResponseDto {
  @ApiProperty({ example: 'c1a2b3d4-uuid' })
  id!: string;

  @ApiProperty({ example: 'c1a2b3d4-uuid' })
  vehicleId!: string;

  @ApiProperty({ example: '/uploads/vehicles/c1a2b3d4-uuid.webp' })
  url!: string;

  @ApiProperty({ example: 'c1a2b3d4-uuid.webp' })
  filename!: string;

  @ApiProperty({ example: 'image/webp' })
  mimetype!: string;

  @ApiProperty({ example: 204800 })
  size!: number;

  @ApiProperty({
    example: '2026-05-07T19:17:06.000Z',
    type: String,
    format: 'date-time',
  })
  createdAt!: Date;

  constructor(image: VehicleImageResponseInput) {
    Object.assign(this, image);
  }
}
