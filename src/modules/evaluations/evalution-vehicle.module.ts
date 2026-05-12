import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { VehicleOwnerGuard } from '../vehicles/guards/vehicle-owner/vehicle-owner.guard';
import { VehicleEvaluationsController } from './evalution-vehicle.controller';
import { EvalutionVehicleService } from './evalution-vehicle.service';

@Module({
  imports: [AuthModule],
  controllers: [VehicleEvaluationsController],
  providers: [EvalutionVehicleService, VehicleOwnerGuard],
})
export class EvalutionVehicleModule {}
