import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { VehicleType } from '../../../../generated/prisma/enums';

export class CreateChecklistTemplateDto {
  @ApiProperty({ example: 'Checklist padrão carro' })
  @MaxLength(255)
  @IsString()
  name!: string;

  @ApiProperty({ example: VehicleType.CAR, enum: VehicleType })
  @IsEnum(VehicleType)
  vehicleType!: VehicleType;

  @ApiProperty({ example: true, required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
