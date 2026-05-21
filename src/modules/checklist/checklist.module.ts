import { Module } from '@nestjs/common';
import { ChecklistService } from './checklist-templates.service';
import {
  ChecklistTemplateItemsController,
  ChecklistTemplatesController,
} from './checklist-templates.controller';
import { AuthModule } from '../auth/auth.module';
import { AdminGuard } from 'src/common/guards/admin.guard';

@Module({
  imports: [AuthModule],
  controllers: [ChecklistTemplatesController, ChecklistTemplateItemsController],
  providers: [ChecklistService, AdminGuard],
})
export class ChecklistModule {}
