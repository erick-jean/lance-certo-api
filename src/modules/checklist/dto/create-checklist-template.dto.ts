import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { VehicleType } from '../../../../generated/prisma/enums';

const trimString = (value: unknown): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CreateChecklistTemplateDto {
  @ApiProperty({ example: 'Checklist padrão carro' })
  @Transform(({ value }: { value: unknown }) => trimString(value))
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
