import { Module } from '@nestjs/common';
import { ChecklistTemplateItemService } from './checklist-template-item.service';
import { ChecklistTemplateItemController } from './checklist-template-item.controller';

@Module({
  controllers: [ChecklistTemplateItemController],
  providers: [ChecklistTemplateItemService],
})
export class ChecklistTemplateItemModule {}
