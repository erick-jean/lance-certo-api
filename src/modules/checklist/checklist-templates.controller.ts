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
  UseGuards,
} from '@nestjs/common';
import { ChecklistService } from './checklist-templates.service';
import { CreateChecklistTemplateDto } from './dto/create-checklist-template.dto';
import { UpdateChecklistDto } from './dto/update-checklist.dto';
import { ResponseChecklistTemplateDto } from './dto/response-checklist-template.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from 'src/modules/auth/auth.guard';
import { AdminGuard } from 'src/common/guards/admin.guard';
import { CreateChecklistTemplateItemDto } from './dto/create-checklist-template-item.dto';
import { ResponseChecklistTemplateItemDto } from './dto/response-checklist-template-item.dto';
import { UpdateChecklistTemplateItemDto } from './dto/update-checklist-template-item.dto';

@ApiTags('Checklist Templates')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Não autorizado.' })
@ApiForbiddenResponse({ description: 'Acesso de administrador obrigatório.' })
@ApiTooManyRequestsResponse({ description: 'Muitas requisições.' })
/**
 * Checklist templates and template items are administrative reference data.
 * Every route requires a valid JWT and admin role because changes or reads here
 * expose the global checklist rules used by vehicle evaluations.
 */
@UseGuards(AuthGuard, AdminGuard)
@Controller()
export class ChecklistController {
  constructor(private readonly checklistService: ChecklistService) {}

  @ApiOperation({ summary: 'Cria Template de Checklist' })
  @ApiCreatedResponse({ type: ResponseChecklistTemplateDto })
  @Throttle({ default: { limit: 20, ttl: 60_000, blockDuration: 120_000 } })
  @Post('checklist-templates')
  createChecklistTemplate(
    @Body() createChecklistTemplateDto: CreateChecklistTemplateDto,
  ): Promise<ResponseChecklistTemplateDto> {
    return this.checklistService.createChecklistTemplate(
      createChecklistTemplateDto,
    );
  }

  @ApiOperation({ summary: 'Busca todos os Template de Checklist' })
  @ApiOkResponse({ type: ResponseChecklistTemplateDto, isArray: true })
  @Throttle({ default: { limit: 60, ttl: 60_000, blockDuration: 60_000 } })
  @Get('checklist-templates')
  findAllChecklistTemplate(): Promise<ResponseChecklistTemplateDto[]> {
    return this.checklistService.listChecklistTemplates();
  }

  @ApiOperation({ summary: 'Busca Template de Checklist por id.' })
  @ApiOkResponse({ type: ResponseChecklistTemplateDto })
  @ApiNotFoundResponse({ description: 'Template de checklist não encontrado.' })
  @Throttle({ default: { limit: 60, ttl: 60_000, blockDuration: 60_000 } })
  @Get('checklist-templates/:id')
  findOneChecklistTemplate(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<ResponseChecklistTemplateDto> {
    return this.checklistService.findChecklistTemplateById(id);
  }

  @ApiOperation({ summary: 'Atualiza Template de Checklist.' })
  @ApiOkResponse({ type: ResponseChecklistTemplateDto })
  @ApiNotFoundResponse({ description: 'Template de checklist não encontrado.' })
  @Throttle({ default: { limit: 20, ttl: 60_000, blockDuration: 120_000 } })
  @Patch('checklist-templates/:id')
  updateChecklistTemplate(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateChecklistDto: UpdateChecklistDto,
  ): Promise<ResponseChecklistTemplateDto> {
    return this.checklistService.updateChecklistTemplate(
      id,
      updateChecklistDto,
    );
  }

  @ApiOperation({ summary: 'Remove Template de Checklist.' })
  @ApiNoContentResponse({
    description: 'Template de checklist removido com sucesso.',
  })
  @ApiNotFoundResponse({ description: 'Template de checklist não encontrado.' })
  @Throttle({ default: { limit: 10, ttl: 60_000, blockDuration: 300_000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('checklist-templates/:id')
  removeChecklistTemplate(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    return this.checklistService.deleteChecklistTemplate(id);
  }

  @ApiOperation({ summary: 'Cria Item de Checklist' })
  @Throttle({ default: { limit: 20, ttl: 60_000, blockDuration: 120_000 } })
  @ApiCreatedResponse({ type: ResponseChecklistTemplateItemDto })
  @ApiNotFoundResponse({ description: 'Template de checklist não encontrado.' })
  @Post('checklist-templates/:templateId/items')
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
  @Get('checklist-templates/:templateId/items')
  findAllItemChecklist(
    @Param('templateId', new ParseUUIDPipe()) templateId: string,
  ): Promise<ResponseChecklistTemplateItemDto[]> {
    return this.checklistService.listChecklistTemplateItems(templateId);
  }

  @ApiOperation({ summary: 'Busca item no Template de Checklist por id.' })
  @ApiOkResponse({ type: ResponseChecklistTemplateItemDto })
  @ApiNotFoundResponse({
    description: 'Item do template de checklist não encontrado.',
  })
  @Throttle({ default: { limit: 60, ttl: 60_000, blockDuration: 60_000 } })
  @Get('checklist-template-items/:itemId')
  findOneItemChecklist(
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
  ): Promise<ResponseChecklistTemplateItemDto> {
    return this.checklistService.findChecklistTemplateItemById(itemId);
  }

  @ApiOperation({ summary: 'Atualiza item de Template de Checklist.' })
  @ApiOkResponse({ type: ResponseChecklistTemplateItemDto })
  @ApiNotFoundResponse({
    description: 'Item do template de checklist não encontrado.',
  })
  @Throttle({ default: { limit: 20, ttl: 60_000, blockDuration: 120_000 } })
  @Patch('checklist-template-items/:itemId')
  updateItemChecklist(
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
    @Body() updateChecklistTemplateItemDto: UpdateChecklistTemplateItemDto,
  ): Promise<ResponseChecklistTemplateItemDto> {
    return this.checklistService.updateChecklistTemplateItem(
      itemId,
      updateChecklistTemplateItemDto,
    );
  }

  @ApiOperation({ summary: 'Remove item de Template de Checklist.' })
  @ApiNoContentResponse({
    description: 'Item do template de checklist removido com sucesso.',
  })
  @ApiNotFoundResponse({
    description: 'Item do template de checklist não encontrado.',
  })
  @Throttle({ default: { limit: 10, ttl: 60_000, blockDuration: 300_000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('checklist-template-items/:itemId')
  removeItemChecklist(
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
  ): Promise<void> {
    return this.checklistService.deleteChecklistTemplateItem(itemId);
  }

  @ApiOperation({
    summary: 'Busca item no Template de Checklist por id.',
    deprecated: true,
  })
  @ApiOkResponse({ type: ResponseChecklistTemplateItemDto })
  @ApiNotFoundResponse({
    description: 'Item do template de checklist não encontrado.',
  })
  @Throttle({ default: { limit: 60, ttl: 60_000, blockDuration: 60_000 } })
  @Get('checklist-template/:itemId/items')
  findOneItemChecklistLegacy(
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
  ): Promise<ResponseChecklistTemplateItemDto> {
    // TODO: remove this legacy route after one release cycle.
    return this.checklistService.findChecklistTemplateItemById(itemId);
  }

  @ApiOperation({
    summary: 'Atualiza item de Template de Checklist.',
    deprecated: true,
  })
  @ApiOkResponse({ type: ResponseChecklistTemplateItemDto })
  @ApiNotFoundResponse({
    description: 'Item do template de checklist não encontrado.',
  })
  @Throttle({ default: { limit: 20, ttl: 60_000, blockDuration: 120_000 } })
  @Patch('checklist-template/:itemId/items')
  updateItemChecklistLegacy(
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
    @Body() updateChecklistTemplateItemDto: UpdateChecklistTemplateItemDto,
  ): Promise<ResponseChecklistTemplateItemDto> {
    // TODO: remove this legacy route after one release cycle.
    return this.checklistService.updateChecklistTemplateItem(
      itemId,
      updateChecklistTemplateItemDto,
    );
  }

  @ApiOperation({
    summary: 'Remove item de Template de Checklist.',
    deprecated: true,
  })
  @ApiNoContentResponse({
    description: 'Item do template de checklist removido com sucesso.',
  })
  @ApiNotFoundResponse({
    description: 'Item do template de checklist não encontrado.',
  })
  @Throttle({ default: { limit: 10, ttl: 60_000, blockDuration: 300_000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('checklist-template/:itemId/items')
  removeItemChecklistLegacy(
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
  ): Promise<void> {
    // TODO: remove this legacy route after one release cycle.
    return this.checklistService.deleteChecklistTemplateItem(itemId);
  }
}
