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
import { Transform, Type } from 'class-transformer';
import { ChecklistSeverity } from '../../../../generated/prisma/enums';

const trimString = (value: unknown): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CreateChecklistTemplateItemDto {
  @ApiProperty({
    example: 'Lataria',
  })
  @Transform(({ value }: { value: unknown }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  category!: string;

  @ApiProperty({
    example: 'Parachoque dianteiro',
  })
  @Transform(({ value }: { value: unknown }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({
    example: 'O parachoque dianteiro está danificado?',
  })
  @Transform(({ value }: { value: unknown }) => trimString(value))
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
    example: false,
    default: false,
    description: 'Indica se o item é exclusivo do plano premium.',
  })
  @IsBoolean()
  @IsOptional()
  isPremiumOnly?: boolean;

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
