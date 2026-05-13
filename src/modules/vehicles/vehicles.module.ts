import { Module } from '@nestjs/common';
import { PlanGuard } from 'src/common/guards/plan.guard';
import { AuthModule } from '../auth/auth.module';
import { VehiclesService } from './vehicles.service';
import { VehiclesController } from './vehicles.controller';
import { VehicleOwnerGuard } from './guards/vehicle-owner/vehicle-owner.guard';
import { VehicleImagesController } from './images/vehicle-images.controller';
import { VehicleImagesService } from './images/vehicle-images.service';

@Module({
  imports: [AuthModule],
  controllers: [VehiclesController, VehicleImagesController],
  providers: [
    VehiclesService,
    VehicleImagesService,
    VehicleOwnerGuard,
    PlanGuard,
  ],
})
export class VehiclesModule {}
