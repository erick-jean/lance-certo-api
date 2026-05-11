import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChecklistSeverity } from '../../../../../generated/prisma/enums';

export class ResponseChecklistTemplateItemDto {
  constructor(partial: Partial<ResponseChecklistTemplateItemDto>) {
    Object.assign(this, partial);
  }
  @ApiProperty({ example: 'c1a2b3d4-uuid' })
  id!: string;

  @ApiProperty({ example: 'c1a2b3d4-uuid' })
  templateId!: string;

  @ApiProperty({ example: 'Lataria' })
  category!: string;

  @ApiProperty({ example: 'Parachoque dianteiro' })
  name!: string;

  @ApiPropertyOptional({ example: 350.75 })
  defaultEstimatedCost?: number | null;

  @ApiProperty({
    enum: ChecklistSeverity,
    example: ChecklistSeverity.MEDIUM,
  })
  severity!: ChecklistSeverity;

  @ApiProperty({ example: false })
  requiresQuantity!: boolean;

  @ApiProperty({ example: true })
  isRequired!: boolean;

  @ApiProperty({ example: 1 })
  order!: number;

  @ApiProperty({ example: '2026-05-06T17:32:44.757Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-05-06T17:32:44.757Z' })
  updatedAt!: Date;
}
