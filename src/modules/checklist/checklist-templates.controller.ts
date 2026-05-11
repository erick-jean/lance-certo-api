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
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiForbiddenResponse({ description: 'Admin access required' })
@ApiTooManyRequestsResponse({ description: 'Too many requests' })
/**
 * Checklist templates are administrative reference data used by evaluations.
 * Keeping every route behind AuthGuard + AdminGuard prevents regular users
 * from changing global checklist rules for other users.
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
    return this.checklistService.findAllChecklistTemplate();
  }

  @ApiOperation({ summary: 'Busca Template de Checklist por id.' })
  @ApiOkResponse({ type: ResponseChecklistTemplateDto })
  @ApiNotFoundResponse({ description: 'Template Checklist not found' })
  @Throttle({ default: { limit: 60, ttl: 60_000, blockDuration: 60_000 } })
  @Get('checklist-templates/:id')
  findOneChecklistTemplate(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<ResponseChecklistTemplateDto> {
    return this.checklistService.findOneChecklistTemplate(id);
  }

  @ApiOperation({ summary: 'Atualiza Template de Checklist.' })
  @ApiOkResponse({ type: ResponseChecklistTemplateDto })
  @ApiNotFoundResponse({ description: 'Template Checklist not found' })
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
    description: 'Template Checklist removed successfully',
  })
  @ApiNotFoundResponse({ description: 'Template Checklist not found' })
  @Throttle({ default: { limit: 10, ttl: 60_000, blockDuration: 300_000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('checklist-templates/:id')
  removeChecklistTemplate(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    return this.checklistService.removeChecklistTemplate(id);
  }

  // Busca itens de Checklist

  @ApiOperation({ summary: 'Cria Item de Checklist' })
  @Throttle({ default: { limit: 20, ttl: 60_000, blockDuration: 120_000 } })
  @ApiCreatedResponse({ type: ResponseChecklistTemplateItemDto })
  @ApiNotFoundResponse({ description: 'Template Checklist not found' })
  @Post('checklist-templates/:templateId/items')
  createItemChecklist(
    @Param('templateId', new ParseUUIDPipe()) templateId: string,
    @Body() createChecklistTemplateItemDto: CreateChecklistTemplateItemDto,
  ): Promise<ResponseChecklistTemplateItemDto> {
    return this.checklistService.createItemChecklist(
      templateId,
      createChecklistTemplateItemDto,
    );
  }

  @ApiOperation({ summary: 'Busca todos Itens de um Template Checklist' })
  @ApiOkResponse({ type: ResponseChecklistTemplateItemDto, isArray: true })
  @ApiNotFoundResponse({ description: 'Template Checklist not found' })
  @Throttle({ default: { limit: 60, ttl: 60_000, blockDuration: 60_000 } })
  @Get('checklist-templates/:templateId/items')
  findAllItemChecklist(
    @Param('templateId', new ParseUUIDPipe()) templateId: string,
  ): Promise<ResponseChecklistTemplateItemDto[]> {
    return this.checklistService.findAllItemChecklist(templateId);
  }

  @ApiOperation({ summary: 'Busca item no Template de Checklist por id.' })
  @ApiOkResponse({ type: ResponseChecklistTemplateItemDto })
  @ApiNotFoundResponse({ description: 'Template Checklist item not found' })
  @Throttle({ default: { limit: 60, ttl: 60_000, blockDuration: 60_000 } })
  @Get('checklist-template/:itemId/items')
  findOneItemChecklist(
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
  ): Promise<ResponseChecklistTemplateItemDto> {
    return this.checklistService.findOneItemChecklist(itemId);
  }

  @ApiOperation({ summary: 'Atualiza item de Template de Checklist.' })
  @ApiOkResponse({ type: ResponseChecklistTemplateItemDto })
  @ApiNotFoundResponse({ description: 'Template Checklist item not found' })
  @Throttle({ default: { limit: 20, ttl: 60_000, blockDuration: 120_000 } })
  @Patch('checklist-template/:itemId/items')
  updateItemChecklist(
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
    @Body() updateChecklistTemplateItemDto: UpdateChecklistTemplateItemDto,
  ): Promise<ResponseChecklistTemplateItemDto> {
    return this.checklistService.updateItemChecklist(
      itemId,
      updateChecklistTemplateItemDto,
    );
  }

  @ApiOperation({ summary: 'Remove item de Template de Checklist.' })
  @ApiNoContentResponse({
    description: 'Template Checklist item removed successfully',
  })
  @ApiNotFoundResponse({ description: 'Template Checklist item not found' })
  @Throttle({ default: { limit: 10, ttl: 60_000, blockDuration: 300_000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('checklist-template/:itemId/items')
  removeItemChecklist(
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
  ): Promise<void> {
    return this.checklistService.removeItemChecklist(itemId);
  }
}
