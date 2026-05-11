import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ChecklistTemplateItemService } from './checklist-template-item.service';
import { CreateChecklistTemplateItemDto } from './dto/create-checklist-template-item.dto';
import { UpdateChecklistTemplateItemDto } from './dto/update-checklist-template-item.dto';

@Controller('checklist-template-item')
export class ChecklistTemplateItemController {
  constructor(private readonly checklistTemplateItemService: ChecklistTemplateItemService) {}

  @Post()
  create(@Body() createChecklistTemplateItemDto: CreateChecklistTemplateItemDto) {
    return this.checklistTemplateItemService.create(createChecklistTemplateItemDto);
  }

  @Get()
  findAll() {
    return this.checklistTemplateItemService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.checklistTemplateItemService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateChecklistTemplateItemDto: UpdateChecklistTemplateItemDto) {
    return this.checklistTemplateItemService.update(+id, updateChecklistTemplateItemDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.checklistTemplateItemService.remove(+id);
  }
}
