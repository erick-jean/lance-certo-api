import { ApiProperty } from '@nestjs/swagger';
import { ResponseEvaluationChecklistItemDto } from 'src/modules/evaluations/dto/response-evaluation-checklist-item.dto';
import { ResponseEvaluationExpenseDto } from 'src/modules/evaluations/dto/response-evaluation-expense.dto';
import { ResponseVehicleEvaluationDto } from 'src/modules/evaluations/dto/response-vehicle-evaluation.dto';
import { ResponseVehicleDto } from 'src/modules/vehicles/dto/response-vehicle.dto';
import { VehicleFinancialSummaryDto } from 'src/modules/vehicles/dto/vehicle-financial-summary.dto';
import { VehicleImageResponseDto } from 'src/modules/vehicles/images/dto/response-vehicle-image.dto';

export class VehicleReportResponseDto {
  @ApiProperty({ type: ResponseVehicleDto })
  vehicle!: ResponseVehicleDto;

  @ApiProperty({ type: [VehicleImageResponseDto] })
  images!: VehicleImageResponseDto[];

  @ApiProperty({ type: ResponseVehicleEvaluationDto, nullable: true })
  evaluation!: ResponseVehicleEvaluationDto | null;

  @ApiProperty({ type: [ResponseEvaluationChecklistItemDto] })
  checklistItems!: ResponseEvaluationChecklistItemDto[];

  @ApiProperty({ type: [ResponseEvaluationExpenseDto] })
  expenses!: ResponseEvaluationExpenseDto[];

  @ApiProperty({ type: VehicleFinancialSummaryDto })
  financialSummary!: VehicleFinancialSummaryDto;

  @ApiProperty({
    example: '2026-05-13T10:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  generatedAt!: Date;
}
