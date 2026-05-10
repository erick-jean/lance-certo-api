import { Module } from '@nestjs/common';
import { ChecklistService } from './service/checklist.service';
import { ChecklistController } from './controller/checklist.controller';

@Module({
  controllers: [ChecklistController],
  providers: [ChecklistService],
})
export class ChecklistModule {}
