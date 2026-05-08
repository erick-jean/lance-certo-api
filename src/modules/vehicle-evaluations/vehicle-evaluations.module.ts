import { Module } from '@nestjs/common';
import { VehicleEvaluationsService } from './vehicle-evaluations.service';
import { VehicleEvaluationsController } from './vehicle-evaluations.controller';

@Module({
  controllers: [VehicleEvaluationsController],
  providers: [VehicleEvaluationsService],
})
export class VehicleEvaluationsModule {}
