import { PartialType } from '@nestjs/swagger';
import { CreateEvaluationExpenseDto } from './create-evaluation-expense.dto';

export class UpdateEvaluationExpenseDto extends PartialType(
  CreateEvaluationExpenseDto,
) {}
