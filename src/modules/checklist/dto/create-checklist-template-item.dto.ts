import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ChecklistSeverity } from '../../../../generated/prisma/enums';

export class CreateChecklistTemplateItemDto {
  @ApiProperty({
    example: 'Lataria',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  category!: string;

  @ApiProperty({
    example: 'Parachoque dianteiro',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({
    example: 'O parachoque dianteiro esta danificado?',
  })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  question?: string | null;

  @ApiPropertyOptional({
    example: 350.75,
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  defaultEstimatedCost?: number | null;

  @ApiProperty({
    enum: ChecklistSeverity,
    example: ChecklistSeverity.MEDIUM,
  })
  @IsEnum(ChecklistSeverity)
  @IsOptional()
  severity?: ChecklistSeverity;

  @ApiPropertyOptional({
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  requiresQuantity?: boolean;

  @ApiPropertyOptional({
    example: true,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @ApiPropertyOptional({
    example: 1,
    default: 0,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;
}
