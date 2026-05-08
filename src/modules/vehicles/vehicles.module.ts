import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { VehiclesService } from './vehicles.service';
import { VehiclesController } from './vehicles.controller';
import { VehicleOwnerGuard } from './guards/vehicle-owner/vehicle-owner.guard';

@Module({
  imports: [AuthModule],
  controllers: [VehiclesController],
  providers: [VehiclesService, VehicleOwnerGuard],
})
export class VehiclesModule {}
