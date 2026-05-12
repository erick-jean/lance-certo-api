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
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '../auth/auth.guard';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { VehicleOwnerGuard } from '../vehicles/guards/vehicle-owner/vehicle-owner.guard';
import { CreateEvaluationExpenseDto } from './dto/create-evaluation-expense.dto';
import { CreateVehicleEvaluationDto } from './dto/create-vehicle-evaluation.dto';
import { ResponseEvaluationChecklistItemDto } from './dto/response-evaluation-checklist-item.dto';
import { ResponseEvaluationExpenseDto } from './dto/response-evaluation-expense.dto';
import { ResponseEvalutionVehicleDto } from './dto/response-evalution-vehicle.dto';
import { UpdateEvaluationChecklistItemDto } from './dto/update-evaluation-checklist-item.dto';
import { UpdateEvaluationExpenseDto } from './dto/update-evaluation-expense.dto';
import { UpdateVehicleEvaluationDto } from './dto/update-vehicle-evaluation.dto';
import { EvalutionVehicleService } from './evalution-vehicle.service';

@ApiTags('Vehicle Evaluation / Avaliacao do veiculo')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiTooManyRequestsResponse({ description: 'Too many requests' })
@UseGuards(AuthGuard, VehicleOwnerGuard)
@Controller('vehicles')
export class VehicleEvaluationsController {
  constructor(
    private readonly evalutionVehicleService: EvalutionVehicleService,
  ) {}

  @ApiOperation({ summary: 'Cria avaliação do veículo.' })
  @ApiCreatedResponse({ type: ResponseEvalutionVehicleDto })
  @Post(':vehicleId/evaluation')
  @Throttle({ default: { limit: 10, ttl: 60_000, blockDuration: 120_000 } })
  create(
    @Req() req: AuthenticatedRequest,
    @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
    @Body() dto: CreateVehicleEvaluationDto,
  ): Promise<ResponseEvalutionVehicleDto> {
    return this.evalutionVehicleService.create(req.user.sub, vehicleId, dto);
  }

  @ApiOperation({ summary: 'Busca avaliação do veículo.' })
  @ApiOkResponse({ type: ResponseEvalutionVehicleDto })
  @Get(':vehicleId/evaluation')
  @Throttle({ default: { limit: 60, ttl: 60_000, blockDuration: 60_000 } })
  findByVehicleId(
    @Req() req: AuthenticatedRequest,
    @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
  ): Promise<ResponseEvalutionVehicleDto> {
    return this.evalutionVehicleService.findByVehicleId(
      req.user.sub,
      vehicleId,
    );
  }

  @ApiOperation({ summary: 'Atualiza avaliação do veículo.' })
  @ApiOkResponse({ type: ResponseEvalutionVehicleDto })
  @Patch(':vehicleId/evaluation')
  @Throttle({ default: { limit: 20, ttl: 60_000, blockDuration: 120_000 } })
  updateByVehicleId(
    @Req() req: AuthenticatedRequest,
    @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
    @Body() dto: UpdateVehicleEvaluationDto,
  ): Promise<ResponseEvalutionVehicleDto> {
    return this.evalutionVehicleService.updateByVehicleId(
      req.user.sub,
      vehicleId,
      dto,
    );
  }

  @ApiOperation({ summary: 'Remove avaliação do veículo.' })
  @ApiNoContentResponse({ description: 'Vehicle evaluation removed' })
  @Delete(':vehicleId/evaluation')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 10, ttl: 60_000, blockDuration: 300_000 } })
  removeByVehicleId(
    @Req() req: AuthenticatedRequest,
    @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
  ): Promise<void> {
    return this.evalutionVehicleService.removeByVehicleId(
      req.user.sub,
      vehicleId,
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
    return this.evalutionVehicleService.findChecklistByVehicleId(
      req.user.sub,
      vehicleId,
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
    return this.evalutionVehicleService.updateChecklistItem(
      req.user.sub,
      vehicleId,
      checklistItemId,
      dto,
    );
  }

  @ApiOperation({ summary: 'Lista gastos da avaliação do veículo.' })
  @ApiOkResponse({ type: [ResponseEvaluationExpenseDto] })
  @Get(':vehicleId/evaluation/expenses')
  @Throttle({ default: { limit: 60, ttl: 60_000, blockDuration: 60_000 } })
  findExpensesByVehicleId(
    @Req() req: AuthenticatedRequest,
    @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
  ): Promise<ResponseEvaluationExpenseDto[]> {
    return this.evalutionVehicleService.findExpensesByVehicleId(
      req.user.sub,
      vehicleId,
    );
  }

  @ApiOperation({ summary: 'Cria gasto manual na avaliação do veículo.' })
  @ApiCreatedResponse({ type: ResponseEvaluationExpenseDto })
  @Post(':vehicleId/evaluation/expenses')
  @Throttle({ default: { limit: 20, ttl: 60_000, blockDuration: 120_000 } })
  createExpense(
    @Req() req: AuthenticatedRequest,
    @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
    @Body() dto: CreateEvaluationExpenseDto,
  ): Promise<ResponseEvaluationExpenseDto> {
    return this.evalutionVehicleService.createExpense(
      req.user.sub,
      vehicleId,
      dto,
    );
  }

  @ApiOperation({ summary: 'Atualiza gasto da avaliação do veículo.' })
  @ApiOkResponse({ type: ResponseEvaluationExpenseDto })
  @Patch(':vehicleId/evaluation/expenses/:expenseId')
  @Throttle({ default: { limit: 30, ttl: 60_000, blockDuration: 120_000 } })
  updateExpense(
    @Req() req: AuthenticatedRequest,
    @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
    @Param('expenseId', new ParseUUIDPipe()) expenseId: string,
    @Body() dto: UpdateEvaluationExpenseDto,
  ): Promise<ResponseEvaluationExpenseDto> {
    return this.evalutionVehicleService.updateExpense(
      req.user.sub,
      vehicleId,
      expenseId,
      dto,
    );
  }

  @ApiOperation({ summary: 'Remove gasto da avaliação do veículo.' })
  @ApiNoContentResponse({ description: 'Vehicle evaluation expense removed' })
  @Delete(':vehicleId/evaluation/expenses/:expenseId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 20, ttl: 60_000, blockDuration: 120_000 } })
  removeExpense(
    @Req() req: AuthenticatedRequest,
    @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
    @Param('expenseId', new ParseUUIDPipe()) expenseId: string,
  ): Promise<void> {
    return this.evalutionVehicleService.removeExpense(
      req.user.sub,
      vehicleId,
      expenseId,
    );
  }
}
