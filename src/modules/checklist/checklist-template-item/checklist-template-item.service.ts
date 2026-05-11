import { Injectable } from '@nestjs/common';
import { CreateChecklistTemplateItemDto } from './dto/create-checklist-template-item.dto';
import { UpdateChecklistTemplateItemDto } from './dto/update-checklist-template-item.dto';

@Injectable()
export class ChecklistTemplateItemService {
  create(createChecklistTemplateItemDto: CreateChecklistTemplateItemDto) {
    return 'This action adds a new checklistTemplateItem';
  }

  findAll() {
    return `This action returns all checklistTemplateItem`;
  }

  findOne(id: number) {
    return `This action returns a #${id} checklistTemplateItem`;
  }

  update(id: number, updateChecklistTemplateItemDto: UpdateChecklistTemplateItemDto) {
    return `This action updates a #${id} checklistTemplateItem`;
  }

  remove(id: number) {
    return `This action removes a #${id} checklistTemplateItem`;
  }
}
