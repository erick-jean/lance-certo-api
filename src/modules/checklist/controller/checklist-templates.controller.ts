import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ChecklistService } from '../service/checklist-templates.service';
import { CreateChecklistTemplateDto } from '../dto/create-checklist-template.dto';
import { UpdateChecklistDto } from '../dto/update-checklist.dto';
import { ResponseChecklistTemplateDto } from '../dto/response-checklist-template.dto';
import { ApiOkResponse } from '@nestjs/swagger';

@Controller('checklist-templates')
export class ChecklistController {
  constructor(private readonly checklistService: ChecklistService) {}

  @ApiOkResponse({
    description: 'Teste',
    type: ResponseChecklistTemplateDto,
  })
  @Post()
  create(
    @Body() CreateChecklistTemplateDto: CreateChecklistTemplateDto,
  ): Promise<ResponseChecklistTemplateDto> {
    return this.checklistService.create(CreateChecklistTemplateDto);
  }

  @Get()
  findAll() {
    return this.checklistService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.checklistService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateChecklistDto: UpdateChecklistDto,
  ) {
    return this.checklistService.update(+id, updateChecklistDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.checklistService.remove(+id);
  }
}
