import { ApiProperty } from '@nestjs/swagger';
import { ExpenseCategory, ExpenseSource } from 'generated/prisma/enums';
import { Prisma } from 'generated/prisma/client';

type ResponseEvaluationExpenseInput = Omit<
  Partial<ResponseEvaluationExpenseDto>,
  'amount'
> & {
  amount: Prisma.Decimal;
};

export class ResponseEvaluationExpenseDto {
  @ApiProperty({ example: 'c1a2b3d4-uuid' })
  id!: string;

  @ApiProperty({ example: 'c1a2b3d4-uuid' })
  evaluationId!: string;

  @ApiProperty({ enum: ExpenseCategory })
  category!: ExpenseCategory;

  @ApiProperty({ enum: ExpenseSource })
  source!: ExpenseSource;

  @ApiProperty({ example: 'Troca de pneus' })
  name!: string;

  @ApiProperty({ example: 1200 })
  amount!: number;

  @ApiProperty({ example: true })
  isRequired!: boolean;

  @ApiProperty({ example: 'Observacao', nullable: true })
  notes!: string | null;

  @ApiProperty({ example: '2026-05-08T15:30:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-05-08T15:30:00.000Z' })
  updatedAt!: Date;

  constructor(expense: ResponseEvaluationExpenseInput) {
    this.id = expense.id!;
    this.evaluationId = expense.evaluationId!;
    this.category = expense.category!;
    this.source = expense.source!;
    this.name = expense.name!;
    this.amount = Number(expense.amount);
    this.isRequired = expense.isRequired ?? false;
    this.notes = expense.notes ?? null;
    this.createdAt = expense.createdAt!;
    this.updatedAt = expense.updatedAt!;
  }
}
