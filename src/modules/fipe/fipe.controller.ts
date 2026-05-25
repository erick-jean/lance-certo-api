import {
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { FipeService } from './fipe.service';
import { GetBrandsQueryDto } from './dto/get-brands-query.dto';
import { ApiOperation, ApiQuery } from '@nestjs/swagger';
import { VehicleType } from './enums/vehicle-type.enum';
import { ResponseModelsFipeApiDto } from './dto/response-models-fipe-api.dto';
import { ResponseBrandsFipeApiDto } from './dto/response-brands-fipe-api.dto';
import { ResponseYearsFipeApiDto } from './dto/response-years-fipe-api.dto';
import { ResponseFipeInfoApiDto } from './dto/response-fipe-info-api.dto';

@Controller('fipe')
export class FipeController {
  constructor(private readonly fipeService: FipeService) {}

  @Get('brands/:vehicleType')
  @ApiOperation({ summary: 'Buscar marcas de veículos' })
  @ApiQuery({
    name: 'vehicleType',
    required: true,
    enum: VehicleType,
    description: 'Tipo do veículo',
    example: VehicleType.CARS,
  })
  async getBrandsVehicles(
    @Query() query: GetBrandsQueryDto,
  ): Promise<ResponseBrandsFipeApiDto[]> {
    return this.fipeService.getBrandsVehicles(
      query.vehicleType,
      query.reference,
    );
  }

  @Get('models/:vehicleType/:brandId')
  @ApiOperation({ summary: 'Buscar modelos de veículos por marca' })
  @ApiQuery({
    name: 'vehicleType',
    required: true,
    enum: VehicleType,
    description: 'Tipo do veículo',
    example: VehicleType.CARS,
  })
  @ApiQuery({
    name: 'brandId',
    required: true,
    description: 'ID da marca',
    example: 1,
  })
  async getModelsVehicles(
    @Query('vehicleType') vehicleType: VehicleType,
    @Query('brandId') brandId: number,
  ): Promise<ResponseModelsFipeApiDto[]> {
    return this.fipeService.getModelsVehicles(vehicleType, brandId);
  }

  @Get(':vehicleType/brands/:brandId/models/:modelId/years')
  @ApiOperation({ summary: 'Buscar anos de um modelo específico' })
  @ApiQuery({
    name: 'vehicleType',
    required: true,
    enum: VehicleType,
    description: 'Tipo do veículo',
    example: VehicleType.CARS,
  })
  async getYearsByModel(
    @Query('vehicleType') vehicleType: VehicleType,
    @Param('brandId') brandId: number,
    @Param('modelId') modelId: number,
  ): Promise<ResponseYearsFipeApiDto[]> {
    return this.fipeService.getYearsByModel(vehicleType, brandId, modelId);
  }

  @Get(':vehicleType/brands/:brandId/models/:modelId/years/:yearId')
  @ApiOperation({ summary: 'Obter informações FIPE de um veículo específico' })
  @ApiQuery({
    name: 'reference',
    required: false,
    description: 'Mes e ano de referencia da FIPE',
    example: 278,
  })
  async getFipeInfo(
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
