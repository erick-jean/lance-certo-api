import { Module } from '@nestjs/common';
import { VehicleEvaluationsService } from './vehicle-evaluations.service';
import { VehicleEvaluationsController } from './vehicle-evaluations.controller';
import { AuthModule } from '../auth/auth.module';
import { VehicleOwnerGuard } from '../vehicles/guards/vehicle-owner/vehicle-owner.guard';

@Module({
  imports: [AuthModule],
  controllers: [VehicleEvaluationsController],
  providers: [VehicleEvaluationsService, VehicleOwnerGuard],
})
export class VehicleEvaluationsModule {}
