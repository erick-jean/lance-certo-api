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
@Controller('admin/checklist-templates')
export class ChecklistController {
  constructor(private readonly checklistService: ChecklistService) {}

  @ApiOperation({ summary: 'Cria Template de Checklist' })
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

  @ApiOperation({ summary: 'Busca todos os Template de Checklist' })
  @ApiOkResponse({ type: ResponseChecklistTemplateDto, isArray: true })
  @Throttle({ default: { limit: 60, ttl: 60_000, blockDuration: 60_000 } })
  @Get()
  findAllChecklistTemplate(): Promise<ResponseChecklistTemplateDto[]> {
    return this.checklistService.findAllChecklistTemplate();
  }

  @ApiOperation({ summary: 'Busca Template de Checklist por id.' })
  @ApiOkResponse({ type: ResponseChecklistTemplateDto })
  @ApiNotFoundResponse({ description: 'Template Checklist not found' })
  @Throttle({ default: { limit: 60, ttl: 60_000, blockDuration: 60_000 } })
  @Get(':id')
  findOneChecklistTemplate(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<ResponseChecklistTemplateDto> {
    return this.checklistService.findOneChecklistTemplate(id);
  }

  @ApiOperation({ summary: 'Atualiza Template de Checklist.' })
  @ApiOkResponse({ type: ResponseChecklistTemplateDto })
  @ApiNotFoundResponse({ description: 'Template Checklist not found' })
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

  @ApiOperation({ summary: 'Remove Template de Checklist.' })
  @ApiNoContentResponse({
    description: 'Template Checklist removed successfully',
  })
  @ApiNotFoundResponse({ description: 'Template Checklist not found' })
  @Throttle({ default: { limit: 10, ttl: 60_000, blockDuration: 300_000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  removeChecklistTemplate(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    return this.checklistService.removeChecklistTemplate(id);
  }

  @ApiOperation({ summary: 'Cria Item de Checklist' })
  @Throttle({ default: { limit: 20, ttl: 60_000, blockDuration: 120_000 } })
  @ApiCreatedResponse({ type: CreateChecklistTemplateItemDto })
  @Post(':templateId/items')
  createItemChecklist(
    @Param('templateId', new ParseUUIDPipe()) templateId: string,
    @Body() createChecklistTemplateItemDto: CreateChecklistTemplateItemDto,
  ): Promise<ResponseChecklistTemplateItemDto> {
    return this.checklistService.createItemChecklist(
      templateId,
      createChecklistTemplateItemDto,
    );
  }

  @ApiOperation({ summary: 'Busca item no Template de Checklist por id.' })
  @ApiOkResponse({ type: ResponseChecklistTemplateItemDto })
  @ApiNotFoundResponse({ description: 'Template Checklist not found' })
  @Throttle({ default: { limit: 60, ttl: 60_000, blockDuration: 60_000 } })
  @Get(':id/items')
  findOneItemChecklist(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<ResponseChecklistTemplateItemDto> {
    return this.checklistService.findOneItemChecklist(id);
  }
}
