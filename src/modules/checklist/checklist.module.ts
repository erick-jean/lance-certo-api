import { Module } from '@nestjs/common';
import { ChecklistService } from './service/checklist-templates.service';
import { ChecklistController } from './controller/checklist-templates.controller';

@Module({
  controllers: [ChecklistController],
  providers: [ChecklistService],
})
export class ChecklistModule {}
