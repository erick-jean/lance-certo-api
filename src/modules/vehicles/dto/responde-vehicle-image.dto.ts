export class VehicleImageResponseDto {
  id!: string;
  vehicleId!: string;
  url!: string;
  filename!: string;
  mimetype!: string;
  size!: number;
  createdAt!: Date;

  constructor(image: VehicleImageResponseDto) {
    Object.assign(this, image);
  }
}