import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { VehiclesService } from './vehicles.service';
import { VehiclesController } from './vehicles.controller';
import { VehicleOwnerGuard } from './guards/vehicle-owner/vehicle-owner.guard';
import { VehicleEvaluationsController } from './evaluations/vehicle-evaluations.controller';
import { VehicleEvaluationsService } from './evaluations/vehicle-evaluations.service';
import { VehicleImagesController } from './images/vehicle-images.controller';
import { VehicleImagesService } from './images/vehicle-images.service';

@Module({
  imports: [AuthModule],
  controllers: [
    VehiclesController,
    VehicleImagesController,
    VehicleEvaluationsController,
  ],
  providers: [
    VehiclesService,
    VehicleImagesService,
    VehicleEvaluationsService,
    VehicleOwnerGuard,
  ],
})
export class VehiclesModule {}
