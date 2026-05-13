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
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { RequirePlan } from 'src/common/decorators/require-plan.decorator';
import { PlanGuard } from 'src/common/guards/plan.guard';
import { AuthGuard } from '../auth/auth.guard';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { FindVehiclesQueryDto } from './dto/find-vehicles-query.dto';
import { PaginatedVehicleResponseDto } from './dto/paginated-vehicles-response.dto';
import { PurchaseVehicleDto } from './dto/purchase-vehicle.dto';
import { ResponseVehicleDto } from './dto/response-vehicle.dto';
import { SellVehicleDto } from './dto/sell-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleFinancialSummaryDto } from './dto/vehicle-financial-summary.dto';
import { VehiclesService } from './vehicles.service';
import { Throttle } from '@nestjs/throttler';
import { VehicleOwnerGuard } from './guards/vehicle-owner/vehicle-owner.guard';

@ApiTags('Vehicles / Veículos')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Não autorizado.' })
@ApiTooManyRequestsResponse({ description: 'Muitas requisições.' })
@UseGuards(AuthGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @ApiOperation({ summary: 'Lista veículos do usuário autenticado.' })
  @ApiOkResponse({
    description: 'Lista paginada de veículos retornada com sucesso.',
    type: PaginatedVehicleResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Parâmetros de paginação inválidos.',
  })
  @Throttle({ default: { limit: 60, ttl: 60_000, blockDuration: 60_000 } })
  @Get()
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query() query: FindVehiclesQueryDto,
  ): Promise<PaginatedVehicleResponseDto> {
    return this.vehiclesService.listUserVehicles(req.user.sub, query);
  }

  @ApiOperation({ summary: 'Cadastra novo veículo.' })
  @ApiCreatedResponse({ type: ResponseVehicleDto })
  @ApiBadRequestResponse({ description: 'Dados do veículo inválidos.' })
  @ApiForbiddenResponse({ description: 'Limite do plano grátis atingido.' })
  @Post()
  @Throttle({ default: { limit: 20, ttl: 60_000, blockDuration: 120_000 } })
  create(
    @Body() createVehicleDto: CreateVehicleDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ResponseVehicleDto> {
    return this.vehiclesService.createVehicleForUser(
      req.user.sub,
      createVehicleDto,
      req.user.role,
    );
  }

  @ApiOperation({ summary: 'Busca veículo específico.' })
  @ApiOkResponse({ type: ResponseVehicleDto })
  @ApiNotFoundResponse({ description: 'Veículo não encontrado.' })
  @Get(':vehicleId')
  @Throttle({ default: { limit: 60, ttl: 60_000, blockDuration: 60_000 } })
  @UseGuards(VehicleOwnerGuard)
  findOne(
    @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<ResponseVehicleDto> {
    return this.vehiclesService.findUserVehicleById(
      req.user.sub,
      vehicleId,
      req.user.role,
    );
  }

  @ApiOperation({ summary: 'Marca veículo como arrematado.' })
  @ApiOkResponse({ type: ResponseVehicleDto })
  @ApiForbiddenResponse({
    description: 'Plano premium necessário para acessar este recurso.',
  })
  @RequirePlan('premium')
  @Patch(':vehicleId/purchase')
  @UseGuards(VehicleOwnerGuard, PlanGuard)
  markAsPurchased(
    @Req() req: AuthenticatedRequest,
    @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
    @Body() dto: PurchaseVehicleDto,
  ): Promise<ResponseVehicleDto> {
    return this.vehiclesService.markVehicleAsPurchased(
      req.user.sub,
      vehicleId,
      dto,
      req.user.role,
    );
  }

  @ApiOperation({ summary: 'Marca veículo como vendido.' })
  @ApiOkResponse({ type: ResponseVehicleDto })
  @ApiForbiddenResponse({
    description: 'Plano premium necessário para acessar este recurso.',
  })
  @RequirePlan('premium')
  @Patch(':vehicleId/sale')
  @UseGuards(VehicleOwnerGuard, PlanGuard)
  markAsSold(
    @Req() req: AuthenticatedRequest,
    @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
    @Body() dto: SellVehicleDto,
  ): Promise<ResponseVehicleDto> {
    return this.vehiclesService.markVehicleAsSold(
      req.user.sub,
      vehicleId,
      dto,
      req.user.role,
    );
  }

  @ApiOperation({ summary: 'Busca resumo financeiro do veículo.' })
  @ApiOkResponse({ type: VehicleFinancialSummaryDto })
  @ApiForbiddenResponse({
    description: 'Plano premium necessário para acessar este recurso.',
  })
  @RequirePlan('premium')
  @Get(':vehicleId/financial-summary')
  @UseGuards(VehicleOwnerGuard, PlanGuard)
  getFinancialSummary(
    @Req() req: AuthenticatedRequest,
    @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
  ): Promise<VehicleFinancialSummaryDto> {
    return this.vehiclesService.getVehicleFinancialSummary(
      req.user.sub,
      vehicleId,
      req.user.role,
    );
  }

  @ApiOperation({ summary: 'Atualiza veículo.' })
  @ApiOkResponse({ type: ResponseVehicleDto })
  @ApiBadRequestResponse({ description: 'Dados do veículo inválidos.' })
  @ApiNotFoundResponse({ description: 'Veículo não encontrado.' })
  @Throttle({ default: { limit: 30, ttl: 60_000, blockDuration: 120_000 } })
  @Patch(':vehicleId')
  @UseGuards(VehicleOwnerGuard)
  update(
    @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
    @Body() updateVehicleDto: UpdateVehicleDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ResponseVehicleDto> {
    return this.vehiclesService.updateUserVehicle(
      req.user.sub,
      vehicleId,
      updateVehicleDto,
      req.user.role,
    );
  }

  @ApiOperation({ summary: 'Remove veículo.' })
  @ApiNoContentResponse({ description: 'Veículo removido com sucesso.' })
  @ApiNotFoundResponse({ description: 'Veículo não encontrado.' })
  @Delete(':vehicleId')
  @Throttle({ default: { limit: 10, ttl: 60_000, blockDuration: 300_000 } })
  @UseGuards(VehicleOwnerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Req() req: AuthenticatedRequest,
    @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
  ): Promise<void> {
    return this.vehiclesService.deleteUserVehicle(
      req.user.sub,
      vehicleId,
      req.user.role,
    );
  }
}
