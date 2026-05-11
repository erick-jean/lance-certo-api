import { Module } from '@nestjs/common';
import { ChecklistService } from './checklist-template/checklist-templates.service';
import { ChecklistController } from './checklist-template/checklist-templates.controller';
import { AuthModule } from '../auth/auth.module';
import { AdminGuard } from 'src/common/guards/admin.guard';

@Module({
  imports: [AuthModule],
  controllers: [ChecklistController],
  providers: [ChecklistService, AdminGuard],
})
export class ChecklistModule {}
