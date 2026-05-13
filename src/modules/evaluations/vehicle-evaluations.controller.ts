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
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RequirePlan } from 'src/common/decorators/require-plan.decorator';
import { PlanGuard } from 'src/common/guards/plan.guard';
import { AuthGuard } from '../auth/auth.guard';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { VehicleOwnerGuard } from '../vehicles/guards/vehicle-owner/vehicle-owner.guard';
import { CreateEvaluationExpenseDto } from './dto/create-evaluation-expense.dto';
import { CreateVehicleEvaluationDto } from './dto/create-vehicle-evaluation.dto';
import { ResponseEvaluationChecklistItemDto } from './dto/response-evaluation-checklist-item.dto';
import { ResponseEvaluationExpenseDto } from './dto/response-evaluation-expense.dto';
import { ResponseVehicleEvaluationDto } from './dto/response-vehicle-evaluation.dto';
import { UpdateEvaluationChecklistItemDto } from './dto/update-evaluation-checklist-item.dto';
import { UpdateEvaluationExpenseDto } from './dto/update-evaluation-expense.dto';
import { UpdateVehicleEvaluationDto } from './dto/update-vehicle-evaluation.dto';
import { VehicleEvaluationsService } from './vehicle-evaluations.service';

@ApiTags('Vehicle Evaluation / Avaliação do veículo')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Não autorizado.' })
@ApiTooManyRequestsResponse({ description: 'Muitas requisições.' })
@UseGuards(AuthGuard, VehicleOwnerGuard)
@Controller('vehicles')
export class VehicleEvaluationsController {
  constructor(
    private readonly vehicleEvaluationsService: VehicleEvaluationsService,
  ) {}

  @ApiOperation({ summary: 'Cria avaliação do veículo.' })
  @ApiCreatedResponse({ type: ResponseVehicleEvaluationDto })
  @Post(':vehicleId/evaluation')
  @Throttle({ default: { limit: 10, ttl: 60_000, blockDuration: 120_000 } })
  create(
    @Req() req: AuthenticatedRequest,
    @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
    @Body() dto: CreateVehicleEvaluationDto,
  ): Promise<ResponseVehicleEvaluationDto> {
    return this.vehicleEvaluationsService.createEvaluationForVehicle(
      req.user.sub,
      vehicleId,
      dto,
      req.user.role,
    );
  }

  @ApiOperation({ summary: 'Busca avaliação do veículo.' })
  @ApiOkResponse({ type: ResponseVehicleEvaluationDto })
  @Get(':vehicleId/evaluation')
  @Throttle({ default: { limit: 60, ttl: 60_000, blockDuration: 60_000 } })
  findByVehicleId(
    @Req() req: AuthenticatedRequest,
    @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
  ): Promise<ResponseVehicleEvaluationDto> {
    return this.vehicleEvaluationsService.findEvaluationForVehicle(
      req.user.sub,
      vehicleId,
      req.user.role,
    );
  }

  @ApiOperation({ summary: 'Atualiza avaliação do veículo.' })
  @ApiOkResponse({ type: ResponseVehicleEvaluationDto })
  @Patch(':vehicleId/evaluation')
  @Throttle({ default: { limit: 20, ttl: 60_000, blockDuration: 120_000 } })
  updateByVehicleId(
    @Req() req: AuthenticatedRequest,
    @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
    @Body() dto: UpdateVehicleEvaluationDto,
  ): Promise<ResponseVehicleEvaluationDto> {
    return this.vehicleEvaluationsService.updateEvaluationMargins(
      req.user.sub,
      vehicleId,
      dto,
      req.user.role,
    );
  }

  @ApiOperation({ summary: 'Remove avaliação do veículo.' })
  @ApiNoContentResponse({ description: 'Avaliação do veículo removida.' })
  @Delete(':vehicleId/evaluation')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 10, ttl: 60_000, blockDuration: 300_000 } })
  removeByVehicleId(
    @Req() req: AuthenticatedRequest,
    @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
  ): Promise<void> {
    return this.vehicleEvaluationsService.deleteEvaluationForVehicle(
      req.user.sub,
      vehicleId,
      req.user.role,
    );
  }

  @ApiOperation({ summary: 'Lista checklist da avaliação do veículo.' })
  @ApiOkResponse({ type: [ResponseEvaluationChecklistItemDto] })
  @Get(':vehicleId/evaluation/checklist')
  @Throttle({ default: { limit: 60, ttl: 60_000, blockDuration: 60_000 } })
  findChecklistByVehicleId(
    @Req() req: AuthenticatedRequest,
    @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
  ): Promise<ResponseEvaluationChecklistItemDto[]> {
    return this.vehicleEvaluationsService.listChecklistForVehicle(
      req.user.sub,
      vehicleId,
      req.user.role,
    );
  }

  @ApiOperation({ summary: 'Atualiza item do checklist da avaliação.' })
  @ApiOkResponse({ type: ResponseEvaluationChecklistItemDto })
  @Patch(':vehicleId/evaluation/checklist-items/:checklistItemId')
  @Throttle({ default: { limit: 30, ttl: 60_000, blockDuration: 120_000 } })
  updateChecklistItem(
    @Req() req: AuthenticatedRequest,
    @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
    @Param('checklistItemId', new ParseUUIDPipe()) checklistItemId: string,
    @Body() dto: UpdateEvaluationChecklistItemDto,
  ): Promise<ResponseEvaluationChecklistItemDto> {
    return this.vehicleEvaluationsService.updateChecklistItemAnswer(
      req.user.sub,
      vehicleId,
      checklistItemId,
      dto,
      req.user.role,
    );
  }

  @ApiOperation({ summary: 'Lista gastos da avaliação do veículo.' })
  @ApiOkResponse({ type: [ResponseEvaluationExpenseDto] })
  @ApiForbiddenResponse({
    description: 'Plano premium necessário para acessar este recurso.',
  })
  @Get(':vehicleId/evaluation/expenses')
  @RequirePlan('premium')
  @UseGuards(AuthGuard, VehicleOwnerGuard, PlanGuard)
  @Throttle({ default: { limit: 60, ttl: 60_000, blockDuration: 60_000 } })
  findExpensesByVehicleId(
    @Req() req: AuthenticatedRequest,
    @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
  ): Promise<ResponseEvaluationExpenseDto[]> {
    return this.vehicleEvaluationsService.listEvaluationExpenses(
      req.user.sub,
      vehicleId,
      req.user.role,
    );
  }

  @ApiOperation({ summary: 'Cria gasto manual na avaliação do veículo.' })
  @ApiCreatedResponse({ type: ResponseEvaluationExpenseDto })
  @ApiForbiddenResponse({
    description: 'Plano premium necessário para acessar este recurso.',
  })
  @Post(':vehicleId/evaluation/expenses')
  @RequirePlan('premium')
  @UseGuards(AuthGuard, VehicleOwnerGuard, PlanGuard)
  @Throttle({ default: { limit: 20, ttl: 60_000, blockDuration: 120_000 } })
  createExpense(
    @Req() req: AuthenticatedRequest,
    @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
    @Body() dto: CreateEvaluationExpenseDto,
  ): Promise<ResponseEvaluationExpenseDto> {
    return this.vehicleEvaluationsService.createManualEvaluationExpense(
      req.user.sub,
      vehicleId,
      dto,
      req.user.role,
    );
  }

  @ApiOperation({ summary: 'Atualiza gasto da avaliação do veículo.' })
  @ApiOkResponse({ type: ResponseEvaluationExpenseDto })
  @ApiForbiddenResponse({
    description: 'Plano premium necessário para acessar este recurso.',
  })
  @Patch(':vehicleId/evaluation/expenses/:expenseId')
  @RequirePlan('premium')
  @UseGuards(AuthGuard, VehicleOwnerGuard, PlanGuard)
  @Throttle({ default: { limit: 30, ttl: 60_000, blockDuration: 120_000 } })
  updateExpense(
    @Req() req: AuthenticatedRequest,
    @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
    @Param('expenseId', new ParseUUIDPipe()) expenseId: string,
    @Body() dto: UpdateEvaluationExpenseDto,
  ): Promise<ResponseEvaluationExpenseDto> {
    return this.vehicleEvaluationsService.updateManualEvaluationExpense(
      req.user.sub,
      vehicleId,
      expenseId,
      dto,
      req.user.role,
    );
  }

  @ApiOperation({ summary: 'Remove gasto da avaliação do veículo.' })
  @ApiNoContentResponse({ description: 'Gasto da avaliação removido.' })
  @ApiForbiddenResponse({
    description: 'Plano premium necessário para acessar este recurso.',
  })
  @Delete(':vehicleId/evaluation/expenses/:expenseId')
  @RequirePlan('premium')
  @UseGuards(AuthGuard, VehicleOwnerGuard, PlanGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 20, ttl: 60_000, blockDuration: 120_000 } })
  removeExpense(
    @Req() req: AuthenticatedRequest,
    @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
    @Param('expenseId', new ParseUUIDPipe()) expenseId: string,
  ): Promise<void> {
    return this.vehicleEvaluationsService.deleteManualEvaluationExpense(
      req.user.sub,
      vehicleId,
      expenseId,
      req.user.role,
    );
  }
}
