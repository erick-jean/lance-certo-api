import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MaxLength } from 'class-validator';
import { VehicleType } from '../../../../generated/prisma/enums';

export class CreateChecklistTemplateDto {
  @ApiProperty({ example: 'Checklist padrão carro' })
  @MaxLength(255)
  @IsString()
  name!: string;

  @ApiProperty({ example: VehicleType.CAR, enum: VehicleType })
  @IsEnum(VehicleType)
  vehicleType!: VehicleType;
}
