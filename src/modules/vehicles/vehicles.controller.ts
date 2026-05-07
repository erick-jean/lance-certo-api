import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
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
  ApiQuery,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { VehicleStatus } from '../../../generated/prisma/enums';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { FindVehiclesQueryDto } from './dto/find-vehicles-query.dto';
import { PaginatedVeichleResponseDto } from './dto/paginated-vehicles-response.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehiclesService } from './vehicles.service';
import { Throttle } from '@nestjs/throttler';

@ApiTags('vehicles')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  /**
   * Lists vehicles owned by the authenticated user with pagination and filters.
   */
  @ApiOperation({ summary: 'Lista veiculos do usuario autenticado' })
  @ApiOkResponse({
    description: 'Lista paginada de veiculos retornada com sucesso',
    type: PaginatedVeichleResponseDto,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
    description: 'Number of items per page (max 100)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['ANALYZING', 'REJECTED', 'PURCHASED', 'SOLD'],
  })
  @ApiQuery({
    name: 'brand',
    required: false,
    example: 'Honda',
  })
  @ApiQuery({
    name: 'model',
    required: false,
    example: 'Civic',
  })
  @ApiQuery({
    name: 'plate',
    required: false,
    example: 'QWE1A23',
  })
  @ApiBadRequestResponse({
    description: 'Invalid pagination parameters',
  })
  @Throttle({ default: { limit: 30, ttl: 60_000, blockDuration: 60_000 } })
  @Get()
  @ApiOkResponse({ type: PaginatedVeichleResponseDto })
  findAll(
    @Req() req: AuthenticatedRequest,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('status', new ParseEnumPipe(VehicleStatus, { optional: true }))
    status?: VehicleStatus,
    @Query('brand') brand?: string,
    @Query('model') model?: string,
    @Query('plate') plate?: string,
  ): Promise<PaginatedVeichleResponseDto> {
    const query: FindVehiclesQueryDto = {
      page,
      limit,
      status,
      brand,
      model,
      plate,
    };

    return this.vehiclesService.findAll(req.user.sub, query);
  }

  /**
   * Creates a new vehicle for the authenticated user.
   *
   * This endpoint allows the authenticated user to register
   * a new vehicle in the system.
   */
  @ApiOperation({ summary: 'Cadastra novo veículo.' })
  @Post()
  @Throttle({ default: { limit: 30, ttl: 60_000, blockDuration: 60_000 } })
  create(
    @Body() createVehicleDto: CreateVehicleDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.vehiclesService.create(req.user.sub, createVehicleDto);
  }

  /**
   * Busca um veículo específico pelo ID, garantindo que o usuário autenticado tenha acesso a ele.
   */
  @ApiOperation({ summary: 'Busca veículo específico.' })
  @Get(':vehicleId')
  @Throttle({ default: { limit: 30, ttl: 60_000, blockDuration: 60_000 } })
  findOne(
    @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.vehiclesService.findOne(req.user.sub, vehicleId);
  }

  @ApiOperation({ summary: 'Atualiza veículo.' })
  @Throttle({ default: { limit: 30, ttl: 60_000, blockDuration: 60_000 } })
  @Patch(':vehicleId')
  update(
    @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
    @Body() updateVehicleDto: UpdateVehicleDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.vehiclesService.update(
      req.user.sub,
      vehicleId,
      updateVehicleDto,
    );
  }

  @ApiOperation({ summary: 'Remove veículo.' })
  @Delete(':vehicleId')
  @Throttle({ default: { limit: 30, ttl: 60_000, blockDuration: 60_000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Req() req: AuthenticatedRequest,
    @Param('vehicleId', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    return this.vehiclesService.remove(req.user.sub, id);
  }
}
