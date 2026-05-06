import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
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

@ApiTags('vehicles')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  create(@Body() createVehicleDto: CreateVehicleDto) {
    return this.vehiclesService.create(createVehicleDto);
  }

  /**
   * Lists vehicles owned by the authenticated user with pagination and filters.
   */
  @ApiOperation({
    summary: 'Lista veiculos',
    description: 'Lista veiculos do usuario autenticado',
  })
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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vehiclesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVehicleDto: UpdateVehicleDto) {
    return this.vehiclesService.update(id, updateVehicleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.vehiclesService.remove(id);
  }
}
