import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Authenticated } from 'src/common/decorators/authenticated.decorator';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { ChecklistService } from './checklist-templates.service';
import { CreateChecklistTemplateItemDto } from './dto/create-checklist-template-item.dto';
import { CreateChecklistTemplateDto } from './dto/create-checklist-template.dto';
import { ResponseChecklistTemplateItemDto } from './dto/response-checklist-template-item.dto';
import { ResponseChecklistTemplateDto } from './dto/response-checklist-template.dto';
import { UpdateChecklistTemplateItemDto } from './dto/update-checklist-template-item.dto';
import { UpdateChecklistDto } from './dto/update-checklist.dto';

@ApiTags('Checklist Templates')
@ApiForbiddenResponse({ description: 'Acesso de administrador obrigatório.' })
@ApiTooManyRequestsResponse({ description: 'Muitas requisições.' })
@Authenticated()
@UseGuards(AdminGuard)
@Controller('checklist-templates')
export class ChecklistTemplatesController {
  constructor(private readonly checklistService: ChecklistService) {}

  @ApiOperation({ summary: 'Cria template de checklist.' })
  @ApiCreatedResponse({ type: ResponseChecklistTemplateDto })
  @Throttle({ default: { limit: 20, ttl: 60_000, blockDuration: 120_000 } })
  @Post()
  createChecklistTemplate(
    @Body() createChecklistTemplateDto: CreateChecklistTemplateDto,
  ): Promise<ResponseChecklistTemplateDto> {
    return this.checklistService.createChecklistTemplate(
      createChecklistTemplateDto,
    );
  }

  @ApiOperation({ summary: 'Busca todos os templates de checklist.' })
  @ApiOkResponse({ type: ResponseChecklistTemplateDto, isArray: true })
  @Throttle({ default: { limit: 60, ttl: 60_000, blockDuration: 60_000 } })
  @Get()
  findAllChecklistTemplate(): Promise<ResponseChecklistTemplateDto[]> {
    return this.checklistService.listChecklistTemplates();
  }

  @ApiOperation({ summary: 'Busca template de checklist por id.' })
  @ApiOkResponse({ type: ResponseChecklistTemplateDto })
  @ApiNotFoundResponse({ description: 'Template de checklist não encontrado.' })
  @Throttle({ default: { limit: 60, ttl: 60_000, blockDuration: 60_000 } })
  @Get(':id')
  findOneChecklistTemplate(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<ResponseChecklistTemplateDto> {
    return this.checklistService.findChecklistTemplateById(id);
  }

  @ApiOperation({ summary: 'Atualiza template de checklist.' })
  @ApiOkResponse({ type: ResponseChecklistTemplateDto })
  @ApiNotFoundResponse({ description: 'Template de checklist não encontrado.' })
  @Throttle({ default: { limit: 20, ttl: 60_000, blockDuration: 120_000 } })
  @Patch(':id')
  updateChecklistTemplate(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateChecklistDto: UpdateChecklistDto,
  ): Promise<ResponseChecklistTemplateDto> {
    return this.checklistService.updateChecklistTemplate(
      id,
      updateChecklistDto,
    );
  }

  @ApiOperation({ summary: 'Remove template de checklist.' })
  @ApiNoContentResponse({
    description: 'Template de checklist removido com sucesso.',
  })
  @ApiNotFoundResponse({ description: 'Template de checklist não encontrado.' })
  @Throttle({ default: { limit: 10, ttl: 60_000, blockDuration: 300_000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  removeChecklistTemplate(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    return this.checklistService.deleteChecklistTemplate(id);
  }
}

@ApiTags('Checklist Template Items')
@ApiForbiddenResponse({ description: 'Acesso de administrador obrigatório.' })
@ApiTooManyRequestsResponse({ description: 'Muitas requisições.' })
@Authenticated()
@UseGuards(AdminGuard)
@Controller('checklist-templates/:templateId/items')
export class ChecklistTemplateItemsController {
  constructor(private readonly checklistService: ChecklistService) {}

  @ApiOperation({ summary: 'Cria item de checklist.' })
  @Throttle({ default: { limit: 20, ttl: 60_000, blockDuration: 120_000 } })
  @ApiCreatedResponse({ type: ResponseChecklistTemplateItemDto })
  @ApiNotFoundResponse({ description: 'Template de checklist não encontrado.' })
  @Post()
  createItemChecklist(
    @Param('templateId', new ParseUUIDPipe()) templateId: string,
    @Body() createChecklistTemplateItemDto: CreateChecklistTemplateItemDto,
  ): Promise<ResponseChecklistTemplateItemDto> {
    return this.checklistService.createChecklistTemplateItem(
      templateId,
      createChecklistTemplateItemDto,
    );
  }

  @ApiOperation({
    summary: 'Busca todos os itens de um template de checklist.',
  })
  @ApiOkResponse({ type: ResponseChecklistTemplateItemDto, isArray: true })
  @ApiNotFoundResponse({ description: 'Template de checklist não encontrado.' })
  @Throttle({ default: { limit: 60, ttl: 60_000, blockDuration: 60_000 } })
  @Get()
  findAllItemChecklist(
    @Param('templateId', new ParseUUIDPipe()) templateId: string,
  ): Promise<ResponseChecklistTemplateItemDto[]> {
    return this.checklistService.listChecklistTemplateItems(templateId);
  }

  @ApiOperation({ summary: 'Busca item no template de checklist por id.' })
  @ApiOkResponse({ type: ResponseChecklistTemplateItemDto })
  @ApiNotFoundResponse({
    description: 'Item do template de checklist não encontrado.',
  })
  @Throttle({ default: { limit: 60, ttl: 60_000, blockDuration: 60_000 } })
  @Get(':itemId')
  findOneItemChecklist(
    @Param('templateId', new ParseUUIDPipe()) _templateId: string,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
  ): Promise<ResponseChecklistTemplateItemDto> {
    return this.checklistService.findChecklistTemplateItemById(itemId);
  }

  @ApiOperation({ summary: 'Atualiza item de template de checklist.' })
  @ApiOkResponse({ type: ResponseChecklistTemplateItemDto })
  @ApiNotFoundResponse({
    description: 'Item do template de checklist não encontrado.',
  })
  @Throttle({ default: { limit: 20, ttl: 60_000, blockDuration: 120_000 } })
  @Patch(':itemId')
  updateItemChecklist(
    @Param('templateId', new ParseUUIDPipe()) _templateId: string,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
    @Body() updateChecklistTemplateItemDto: UpdateChecklistTemplateItemDto,
  ): Promise<ResponseChecklistTemplateItemDto> {
    return this.checklistService.updateChecklistTemplateItem(
      itemId,
      updateChecklistTemplateItemDto,
    );
  }

  @ApiOperation({ summary: 'Remove item de template de checklist.' })
  @ApiNoContentResponse({
    description: 'Item do template de checklist removido com sucesso.',
  })
  @ApiNotFoundResponse({
    description: 'Item do template de checklist não encontrado.',
  })
  @Throttle({ default: { limit: 10, ttl: 60_000, blockDuration: 300_000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':itemId')
  removeItemChecklist(
    @Param('templateId', new ParseUUIDPipe()) _templateId: string,
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
  ): Promise<void> {
    return this.checklistService.deleteChecklistTemplateItem(itemId);
  }
}
