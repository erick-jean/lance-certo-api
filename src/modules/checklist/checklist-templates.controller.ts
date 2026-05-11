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
@ApiTooManyRequestsResponse({ description: 'Too many requests' })
/**
 * Every checklist route requires a valid JWT. AdminGuard is applied per route
 * because users may read template items when creating/evaluating vehicles, but
 * only admins can change the global checklist reference data.
 */
@UseGuards(AuthGuard)
@Controller()
export class ChecklistController {
  constructor(private readonly checklistService: ChecklistService) {}

  @ApiOperation({ summary: 'Cria Template de Checklist' })
  @ApiCreatedResponse({ type: ResponseChecklistTemplateDto })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @Throttle({ default: { limit: 20, ttl: 60_000, blockDuration: 120_000 } })
  @UseGuards(AdminGuard)
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
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @ApiNotFoundResponse({ description: 'Template Checklist not found' })
  @Throttle({ default: { limit: 60, ttl: 60_000, blockDuration: 60_000 } })
  @UseGuards(AdminGuard)
  @Get('checklist-templates/:id')
  findOneChecklistTemplate(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<ResponseChecklistTemplateDto> {
    return this.checklistService.findOneChecklistTemplate(id);
  }

  @ApiOperation({ summary: 'Atualiza Template de Checklist.' })
  @ApiOkResponse({ type: ResponseChecklistTemplateDto })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @ApiNotFoundResponse({ description: 'Template Checklist not found' })
  @Throttle({ default: { limit: 20, ttl: 60_000, blockDuration: 120_000 } })
  @UseGuards(AdminGuard)
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
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @ApiNotFoundResponse({ description: 'Template Checklist not found' })
  @Throttle({ default: { limit: 10, ttl: 60_000, blockDuration: 300_000 } })
  @UseGuards(AdminGuard)
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
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @ApiNotFoundResponse({ description: 'Template Checklist not found' })
  @UseGuards(AdminGuard)
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
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @ApiNotFoundResponse({ description: 'Template Checklist item not found' })
  @Throttle({ default: { limit: 60, ttl: 60_000, blockDuration: 60_000 } })
  @UseGuards(AdminGuard)
  @Get('checklist-template/:itemId/items')
  findOneItemChecklist(
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
  ): Promise<ResponseChecklistTemplateItemDto> {
    return this.checklistService.findOneItemChecklist(itemId);
  }

  @ApiOperation({ summary: 'Atualiza item de Template de Checklist.' })
  @ApiOkResponse({ type: ResponseChecklistTemplateItemDto })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @ApiNotFoundResponse({ description: 'Template Checklist item not found' })
  @Throttle({ default: { limit: 20, ttl: 60_000, blockDuration: 120_000 } })
  @UseGuards(AdminGuard)
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
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @ApiNotFoundResponse({ description: 'Template Checklist item not found' })
  @Throttle({ default: { limit: 10, ttl: 60_000, blockDuration: 300_000 } })
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('checklist-template/:itemId/items')
  removeItemChecklist(
    @Param('itemId', new ParseUUIDPipe()) itemId: string,
  ): Promise<void> {
    return this.checklistService.removeItemChecklist(itemId);
  }
}
