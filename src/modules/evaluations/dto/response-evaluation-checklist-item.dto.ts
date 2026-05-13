import { ApiProperty } from '@nestjs/swagger';
import { ChecklistItemStatus, ChecklistSeverity } from 'generated/prisma/enums';
import { Prisma } from 'generated/prisma/client';

type ResponseEvaluationChecklistItemInput = Omit<
  Partial<ResponseEvaluationChecklistItemDto>,
  'estimatedUnitCost' | 'estimatedTotalCost'
> & {
  estimatedUnitCost: Prisma.Decimal | null;
  estimatedTotalCost: Prisma.Decimal | null;
};

export class ResponseEvaluationChecklistItemDto {
  @ApiProperty({ example: 'c1a2b3d4-uuid' })
  id!: string;

  @ApiProperty({ example: 'c1a2b3d4-uuid' })
  evaluationId!: string;

  @ApiProperty({ example: 'Motor' })
  category!: string;

  @ApiProperty({ example: 'Vazamento de oleo' })
  name!: string;

  @ApiProperty({ example: 'Ha vazamento visivel?', nullable: true })
  question!: string | null;

  @ApiProperty({ enum: ChecklistSeverity })
  severity!: ChecklistSeverity;

  @ApiProperty({ example: false })
  requiresQuantity!: boolean;

  @ApiProperty({ example: true })
  isRequired!: boolean;

  @ApiProperty({ example: 1 })
  order!: number;

  @ApiProperty({ enum: ChecklistItemStatus })
  status!: ChecklistItemStatus;

  @ApiProperty({ example: 1 })
  quantity!: number;

  @ApiProperty({ example: 350, nullable: true })
  estimatedUnitCost!: number | null;

  @ApiProperty({ example: 700, nullable: true })
  estimatedTotalCost!: number | null;

  @ApiProperty({ example: 'Observação', nullable: true })
  notes!: string | null;

  @ApiProperty({ example: '2026-05-08T15:30:00.000Z', nullable: true })
  answeredAt!: Date | null;

  @ApiProperty({ example: '2026-05-08T15:30:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-05-08T15:30:00.000Z' })
  updatedAt!: Date;

  constructor(item: ResponseEvaluationChecklistItemInput) {
    this.id = item.id!;
    this.evaluationId = item.evaluationId!;
    this.category = item.category!;
    this.name = item.name!;
    this.question = item.question ?? null;
    this.severity = item.severity!;
    this.requiresQuantity = item.requiresQuantity ?? false;
    this.isRequired = item.isRequired ?? false;
    this.order = item.order ?? 0;
    this.status = item.status!;
    this.quantity = item.quantity ?? 1;
    this.estimatedUnitCost =
      item.estimatedUnitCost === null ? null : Number(item.estimatedUnitCost);
    this.estimatedTotalCost =
      item.estimatedTotalCost === null ? null : Number(item.estimatedTotalCost);
    this.notes = item.notes ?? null;
    this.answeredAt = item.answeredAt ?? null;
    this.createdAt = item.createdAt!;
    this.updatedAt = item.updatedAt!;
  }
}
