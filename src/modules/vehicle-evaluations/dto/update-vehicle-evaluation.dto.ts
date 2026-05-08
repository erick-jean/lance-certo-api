import { PartialType } from '@nestjs/swagger';
import { CreateVehicleEvaluationDto } from './create-vehicle-evaluation.dto';

export class UpdateVehicleEvaluationDto extends PartialType(
  CreateVehicleEvaluationDto,
) {}
