import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChecklistSeverity } from '../../../../generated/prisma/enums';
import { Prisma } from '../../../../generated/prisma/client';

type ChecklistTemplateItemResponseInput = Omit<
  ResponseChecklistTemplateItemDto,
  'defaultEstimatedCost'
> & {
  defaultEstimatedCost: Prisma.Decimal | number | null;
};

export class ResponseChecklistTemplateItemDto {
  @ApiProperty({ example: 'c1a2b3d4-uuid' })
  id!: string;

  @ApiProperty({ example: 'c1a2b3d4-uuid' })
  templateId!: string;

  @ApiProperty({ example: 'Lataria' })
  category!: string;

  @ApiProperty({ example: 'Parachoque dianteiro' })
  name!: string;

  @ApiPropertyOptional({ example: 'O parachoque dianteiro esta danificado?' })
  question?: string | null;

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

  @ApiProperty({ example: false })
  isPremiumOnly!: boolean;

  @ApiProperty({ example: 1 })
  order!: number;

  @ApiProperty({ example: '2026-05-06T17:32:44.757Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-05-06T17:32:44.757Z' })
  updatedAt!: Date;

  constructor(item: ChecklistTemplateItemResponseInput) {
    Object.assign(this, item);
    this.defaultEstimatedCost =
      item.defaultEstimatedCost === null
        ? null
        : Number(item.defaultEstimatedCost);
  }
}
