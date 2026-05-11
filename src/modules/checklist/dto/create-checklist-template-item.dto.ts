import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
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
  category!: string;

  @ApiProperty({
    example: 'Parachoque dianteiro',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    example: 350.75,
  })
  @Type(() => Number)
  @IsOptional()
  defaultEstimatedCost?: number;

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
