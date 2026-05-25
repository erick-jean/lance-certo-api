import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { VehicleType } from '../enums/vehicle-type.enum';

export class GetBrandsQueryDto {
  @IsEnum(VehicleType, {
    message: 'vehicleType deve ser cars, motorcycles ou trucks',
  })
  vehicleType!: VehicleType;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'reference deve ser um número inteiro' })
  reference?: number;
}
