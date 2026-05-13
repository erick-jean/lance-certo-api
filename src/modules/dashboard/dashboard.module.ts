import { Module } from '@nestjs/common';
import { PlanGuard } from 'src/common/guards/plan.guard';
import { AuthModule } from '../auth/auth.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [AuthModule],
  controllers: [DashboardController],
  providers: [DashboardService, PlanGuard],
})
export class DashboardModule {}
