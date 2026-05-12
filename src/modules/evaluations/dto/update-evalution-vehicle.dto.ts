import { PartialType } from '@nestjs/swagger';
import { CreateEvalutionVehicleDto } from './create-evalution-vehicle.dto';

export class UpdateEvalutionVehicleDto extends PartialType(
  CreateEvalutionVehicleDto,
) {}
