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
import { VehicleEvaluationsService } from './vehicle-evaluations.service';
import { CreateVehicleEvaluationDto } from './dto/create-vehicle-evaluation.dto';
import { UpdateVehicleEvaluationDto } from './dto/update-vehicle-evaluation.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ResponseVehicleEvaluationDto } from './dto/response-vehicle-evaluation.dto';

import { VehicleOwnerGuard } from '../guards/vehicle-owner/vehicle-owner.guard';
import { AuthGuard } from '../../auth/auth.guard';
import { Throttle } from '@nestjs/throttler';
import { AuthenticatedRequest } from '../../auth/interfaces/authenticated-request.interface';

@ApiTags('Vehicle Evaluation / Avaliação do veículo')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiTooManyRequestsResponse({ description: 'Too many requests' })
@UseGuards(AuthGuard, VehicleOwnerGuard)
@Controller('vehicles')
export class VehicleEvaluationsController {
  constructor(
    private readonly vehicleEvaluationsService: VehicleEvaluationsService,
  ) {}

  @ApiCreatedResponse({ type: ResponseVehicleEvaluationDto })
  @Post(':vehicleId/evaluation')
  @Throttle({ default: { limit: 10, ttl: 60_000, blockDuration: 120_000 } })
  @ApiOperation({ summary: 'Cria avaliação do veiculo.' })
  create(
    @Req() req: AuthenticatedRequest,
    @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
    @Body() createVehicleEvaluationDto: CreateVehicleEvaluationDto,
  ): Promise<ResponseVehicleEvaluationDto | null> {
    return this.vehicleEvaluationsService.create(
      req.user.sub,
      vehicleId,
      createVehicleEvaluationDto,
    );
  }

  @ApiOperation({ summary: 'Busca avaliação do veículo.' })
  @Get(':vehicleId/evaluation')
  @Throttle({ default: { limit: 60, ttl: 60_000, blockDuration: 60_000 } })
  findOne(
    @Req() req: AuthenticatedRequest,
    @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
  ): Promise<ResponseVehicleEvaluationDto> {
    return this.vehicleEvaluationsService.findOne(req.user.sub, vehicleId);
  }

  @ApiOperation({ summary: 'Atualiza avaliação do veículo.' })
  @Patch(':vehicleId/evaluation')
  @Throttle({ default: { limit: 20, ttl: 60_000, blockDuration: 120_000 } })
  update(
    @Req() req: AuthenticatedRequest,
    @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
    @Body() updateVehicleEvaluationDto: UpdateVehicleEvaluationDto,
  ): Promise<ResponseVehicleEvaluationDto> {
    return this.vehicleEvaluationsService.update(
      req.user.sub,
      vehicleId,
      updateVehicleEvaluationDto,
    );
  }

  @ApiOperation({ summary: 'Apaga avaliação do veículo' })
  @Delete(':vehicleId/evaluation')
  @Throttle({ default: { limit: 10, ttl: 60_000, blockDuration: 300_000 } })
  remove(
    @Req() req: AuthenticatedRequest,
    @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
  ): Promise<void> {
    return this.vehicleEvaluationsService.remove(req.user.sub, vehicleId);
  }

  // @ApiOperation({ summary: 'Recalcula lance recomendado.' })
  // @Post('/vehicles/:vehicleId/evaluation/recalculate')
  // recalculate(@Body() createVehicleEvaluationDto: CreateVehicleEvaluationDto) {
  //   return this.vehicleEvaluationsService.recalculate(
  //     createVehicleEvaluationDto,
  //   );
  // }
}
