import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { VehicleOwnerGuard } from '../vehicles/guards/vehicle-owner/vehicle-owner.guard';
import { EvalutionVehicleController } from './evalution-vehicle.controller';
import { EvalutionVehicleService } from './evalution-vehicle.service';

@Module({
  imports: [AuthModule],
  controllers: [EvalutionVehicleController],
  providers: [EvalutionVehicleService, VehicleOwnerGuard],
})
export class EvalutionVehicleModule {}
