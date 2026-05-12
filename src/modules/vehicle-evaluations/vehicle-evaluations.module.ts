import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { VehicleOwnerGuard } from '../vehicles/guards/vehicle-owner/vehicle-owner.guard';
import { VehicleEvaluationsController } from './vehicle-evaluations.controller';
import { VehicleEvaluationsService } from './vehicle-evaluations.service';

@Module({
  imports: [AuthModule],
  controllers: [VehicleEvaluationsController],
  providers: [VehicleEvaluationsService, VehicleOwnerGuard],
})
export class VehicleEvaluationsModule {}
