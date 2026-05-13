import { Module } from '@nestjs/common';
import { PlanGuard } from 'src/common/guards/plan.guard';
import { AuthModule } from '../auth/auth.module';
import { VehicleOwnerGuard } from '../vehicles/guards/vehicle-owner/vehicle-owner.guard';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [AuthModule],
  controllers: [ReportsController],
  providers: [ReportsService, VehicleOwnerGuard, PlanGuard],
})
export class ReportsModule {}
