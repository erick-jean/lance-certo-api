import {
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Authenticated } from '../../common/decorators/authenticated.decorator';
import { ResponseBrandsFipeApiDto } from './dto/response-brands-fipe-api.dto';
import { ResponseFipeInfoApiDto } from './dto/response-fipe-info-api.dto';
import { ResponseModelsFipeApiDto } from './dto/response-models-fipe-api.dto';
import { ResponseReferenceFipeApiDto } from './dto/response-reference-fipe-api.dto';
import { ResponseYearsFipeApiDto } from './dto/response-years-fipe-api.dto';
import { VehicleType } from './enums/vehicle-type.enum';
import { FipeService } from './fipe.service';

@ApiTags('Fipe')
@ApiBearerAuth()
@Authenticated()
@Throttle({ default: { limit: 30, ttl: 60_000, blockDuration: 60_000 } })
@Controller('fipe')
export class FipeController {
  constructor(private readonly fipeService: FipeService) {}

  @Get('references')
  @ApiOperation({ summary: 'Buscar referencias da tabela FIPE' })
  @ApiOkResponse({ type: ResponseReferenceFipeApiDto, isArray: true })
  getReferences(): Promise<ResponseReferenceFipeApiDto[]> {
    return this.fipeService.getReferences();
  }

  @Get(':vehicleType/brands')
  @ApiOperation({ summary: 'Buscar marcas por tipo de veiculo' })
  @ApiParam({
    name: 'vehicleType',
    enum: VehicleType,
    example: VehicleType.CARS,
  })
  @ApiQuery({
    name: 'reference',
    required: false,
    description: 'Mes e ano de referencia da FIPE',
    example: 308,
  })
  @ApiOkResponse({ type: ResponseBrandsFipeApiDto, isArray: true })
  getBrandsVehicles(
    @Param('vehicleType', new ParseEnumPipe(VehicleType))
    vehicleType: VehicleType,
    @Query('reference', new ParseIntPipe({ optional: true }))
    reference?: number,
  ): Promise<ResponseBrandsFipeApiDto[]> {
    return this.fipeService.getBrandsVehicles(vehicleType, reference);
  }

  @Get(':vehicleType/brands/:brandId/models')
  @ApiOperation({ summary: 'Buscar modelos por marca' })
  @ApiParam({
    name: 'vehicleType',
    enum: VehicleType,
    example: VehicleType.CARS,
  })
  @ApiParam({ name: 'brandId', example: 59 })
  @ApiQuery({
    name: 'reference',
    required: false,
    description: 'Mes e ano de referencia da FIPE',
    example: 308,
  })
  @ApiOkResponse({ type: ResponseModelsFipeApiDto, isArray: true })
  getModelsVehicles(
    @Param('vehicleType', new ParseEnumPipe(VehicleType))
    vehicleType: VehicleType,
    @Param('brandId', ParseIntPipe) brandId: number,
    @Query('reference', new ParseIntPipe({ optional: true }))
    reference?: number,
  ): Promise<ResponseModelsFipeApiDto[]> {
    return this.fipeService.getModelsVehicles(vehicleType, brandId, reference);
  }

  @Get(':vehicleType/brands/:brandId/models/:modelId/years')
  @ApiOperation({ summary: 'Buscar anos por modelo' })
  @ApiParam({
    name: 'vehicleType',
    enum: VehicleType,
    example: VehicleType.CARS,
  })
  @ApiParam({ name: 'brandId', example: 59 })
  @ApiParam({ name: 'modelId', example: 5940 })
  @ApiQuery({
    name: 'reference',
    required: false,
    description: 'Mes e ano de referencia da FIPE',
    example: 308,
  })
  @ApiOkResponse({ type: ResponseYearsFipeApiDto, isArray: true })
  getYearsByModel(
    @Param('vehicleType', new ParseEnumPipe(VehicleType))
    vehicleType: VehicleType,
    @Param('brandId', ParseIntPipe) brandId: number,
    @Param('modelId', ParseIntPipe) modelId: number,
    @Query('reference', new ParseIntPipe({ optional: true }))
    reference?: number,
  ): Promise<ResponseYearsFipeApiDto[]> {
    return this.fipeService.getYearsByModel(
      vehicleType,
      brandId,
      modelId,
      reference,
    );
  }

  @Get(':vehicleType/brands/:brandId/models/:modelId/years/:yearId')
  @ApiOperation({ summary: 'Buscar informacoes FIPE de um veiculo' })
  @ApiParam({
    name: 'vehicleType',
    enum: VehicleType,
    example: VehicleType.CARS,
  })
  @ApiParam({ name: 'brandId', example: 59 })
  @ApiParam({ name: 'modelId', example: 5940 })
  @ApiParam({ name: 'yearId', example: '2014-3' })
  @ApiQuery({
    name: 'reference',
    required: false,
    description: 'Mes e ano de referencia da FIPE',
    example: 308,
  })
  @ApiOkResponse({ type: ResponseFipeInfoApiDto })
  getFipeInfo(
    @Param('vehicleType', new ParseEnumPipe(VehicleType))
    vehicleType: VehicleType,
    @Param('brandId', ParseIntPipe) brandId: number,
    @Param('modelId', ParseIntPipe) modelId: number,
    @Param('yearId') yearId: string,
    @Query('reference', new ParseIntPipe({ optional: true }))
    reference?: number,
  ): Promise<ResponseFipeInfoApiDto> {
    return this.fipeService.getFipeInfo(
      vehicleType,
      brandId,
      modelId,
      yearId,
      reference,
    );
  }
}
