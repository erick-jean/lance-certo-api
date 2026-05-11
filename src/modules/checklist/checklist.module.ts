import { Module } from '@nestjs/common';
import { ChecklistService } from './checklist-template/checklist-templates.service';
import { ChecklistController } from './checklist-template/checklist-templates.controller';
import { AuthModule } from '../auth/auth.module';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { ChecklistTemplateItemService } from './checklist-template-item/checklist-template-item.service';
import { ChecklistTemplateItemController } from './checklist-template-item/checklist-template-item.controller';

@Module({
  imports: [AuthModule],
  controllers: [ChecklistController, ChecklistTemplateItemController],
  providers: [ChecklistService, AdminGuard, ChecklistTemplateItemService],
})
export class ChecklistModule {}
