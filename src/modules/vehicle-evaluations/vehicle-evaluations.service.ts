import { Injectable } from '@nestjs/common';
import { CreateVehicleEvaluationDto } from './dto/create-vehicle-evaluation.dto';
import { UpdateVehicleEvaluationDto } from './dto/update-vehicle-evaluation.dto';

@Injectable()
export class VehicleEvaluationsService {
  create(createVehicleEvaluationDto: CreateVehicleEvaluationDto) {
    return 'This action adds a new vehicleEvaluation';
  }

  findOne(id: number) {
    return `This action returns a #${id} vehicleEvaluation`;
  }

  update(id: number, updateVehicleEvaluationDto: UpdateVehicleEvaluationDto) {
    return `This action updates a #${id} vehicleEvaluation`;
  }

  remove(id: number) {
    return `This action removes a #${id} vehicleEvaluation`;
  }

  recalculate(id: number) {
    return `This action returns a #${id} vehicleEvaluation`;
  }
}
