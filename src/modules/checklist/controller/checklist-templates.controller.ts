import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ChecklistService } from '../service/checklist-templates.service';
import { CreateChecklistTemplateDto } from '../dto/create-checklist-template.dto';
import { UpdateChecklistDto } from '../dto/update-checklist.dto';
import { ResponseChecklistTemplateDto } from '../dto/response-checklist-template.dto';
import {
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';

@Controller('checklist-templates')
export class ChecklistController {
  constructor(private readonly checklistService: ChecklistService) {}

  @ApiOperation({ summary: 'Cria Template de Checklist' })
  @ApiOkResponse({ type: ResponseChecklistTemplateDto })
  @Post()
  create(
    @Body() CreateChecklistTemplateDto: CreateChecklistTemplateDto,
  ): Promise<ResponseChecklistTemplateDto> {
    return this.checklistService.create(CreateChecklistTemplateDto);
  }

  @ApiOperation({ summary: 'Busca todos os Template de Checklist' })
  @ApiOkResponse({ type: ResponseChecklistTemplateDto })
  @Get()
  findAll() {
    return this.checklistService.findAll();
  }

  @ApiOperation({ summary: 'Busca Template de Checklist por id.' })
  @ApiOkResponse({ type: ResponseChecklistTemplateDto })
  @Get(':id')
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<ResponseChecklistTemplateDto> {
    return this.checklistService.findOne(id);
  }

  @ApiOperation({ summary: 'Atualiza Template de Checklist.' })
  @ApiOkResponse({ type: ResponseChecklistTemplateDto })
  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateChecklistDto: UpdateChecklistDto,
  ): Promise<ResponseChecklistTemplateDto> {
    return this.checklistService.update(id, updateChecklistDto);
  }

  @ApiOperation({ summary: 'Remove Template de Checklist.' })
  @ApiNoContentResponse({
    description: 'Template Checklist removed successfully',
  })
  @ApiNotFoundResponse({ description: 'Template Checklist not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    return this.checklistService.remove(id);
  }
}
