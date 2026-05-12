import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { EvalutionVehicleService } from './evalution-vehicle.service';
import { CreateEvalutionVehicleDto } from './dto/create-evalution-vehicle.dto';
import { UpdateEvalutionVehicleDto } from './dto/update-evalution-vehicle.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ResponseEvalutionVehicleDto } from './dto/response-evalution-vehicle.dto';

import { VehicleOwnerGuard } from '../vehicles/guards/vehicle-owner/vehicle-owner.guard';
import { AuthGuard } from '../auth/auth.guard';
import { Throttle } from '@nestjs/throttler';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

@ApiTags('Vehicle Evaluation / Avaliação do veículo')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiTooManyRequestsResponse({ description: 'Too many requests' })
@UseGuards(AuthGuard, VehicleOwnerGuard)
@Controller('vehicles')
export class EvalutionVehicleController {
  constructor(
    private readonly evalutionVehicleService: EvalutionVehicleService,
  ) {}

  @ApiCreatedResponse({ type: ResponseEvalutionVehicleDto })
  @Post(':vehicleId/evaluation')
  @Throttle({ default: { limit: 10, ttl: 60_000, blockDuration: 120_000 } })
  @ApiOperation({ summary: 'Cria avaliação do veiculo.' })
  create(
    @Req() req: AuthenticatedRequest,
    @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
    @Body() createEvalutionVehicleDto: CreateEvalutionVehicleDto,
  ): Promise<ResponseEvalutionVehicleDto | null> {
    return this.evalutionVehicleService.create(
      req.user.sub,
      vehicleId,
      createEvalutionVehicleDto,
    );
  }

  @ApiOperation({ summary: 'Busca avaliação do veículo.' })
  @Get(':vehicleId/evaluation')
  @Throttle({ default: { limit: 60, ttl: 60_000, blockDuration: 60_000 } })
  findOne(
    @Req() req: AuthenticatedRequest,
    @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
  ): Promise<ResponseEvalutionVehicleDto> {
    return this.evalutionVehicleService.findOne(req.user.sub, vehicleId);
  }

  @ApiOperation({ summary: 'Atualiza avaliação do veículo.' })
  @Patch(':vehicleId/evaluation')
  @Throttle({ default: { limit: 20, ttl: 60_000, blockDuration: 120_000 } })
  update(
    @Req() req: AuthenticatedRequest,
    @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
    @Body() updateEvalutionVehicleDto: UpdateEvalutionVehicleDto,
  ): Promise<ResponseEvalutionVehicleDto> {
    return this.evalutionVehicleService.update(
      req.user.sub,
      vehicleId,
      updateEvalutionVehicleDto,
    );
  }

  @ApiOperation({ summary: 'Apaga avaliação do veículo' })
  @Delete(':vehicleId/evaluation')
  @Throttle({ default: { limit: 10, ttl: 60_000, blockDuration: 300_000 } })
  remove(
    @Req() req: AuthenticatedRequest,
    @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
  ): Promise<void> {
    return this.evalutionVehicleService.remove(req.user.sub, vehicleId);
  }

  // @ApiOperation({ summary: 'Recalcula lance recomendado.' })
  // @Post('/vehicles/:vehicleId/evaluation/recalculate')
  // recalculate(@Body() createEvalutionVehicleDto: CreateEvalutionVehicleDto) {
  //   return this.evalutionVehicleService.recalculate(
  //     createEvalutionVehicleDto,
  //   );
  // }
}
