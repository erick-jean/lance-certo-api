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
} from '@nestjs/common';
import { VehicleEvaluationsService } from './vehicle-evaluations.service';
import { CreateVehicleEvaluationDto } from './dto/create-vehicle-evaluation.dto';
import { UpdateVehicleEvaluationDto } from './dto/update-vehicle-evaluation.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ResponseVehicleEvaluationDto } from './dto/response-vehicle-evaluation.dto';

import { VehicleOwnerGuard } from '../vehicles/guards/vehicle-owner/vehicle-owner.guard';
import { AuthGuard } from '../auth/auth.guard';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Vehicle Evaluation / Avaliação do veículo')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiTooManyRequestsResponse({ description: 'Too many requests' })
@UseGuards(AuthGuard, VehicleOwnerGuard)
@Throttle({ default: { limit: 30, ttl: 60_000, blockDuration: 60_000 } })
@Controller('vehicle')
export class VehicleEvaluationsController {
  constructor(
    private readonly vehicleEvaluationsService: VehicleEvaluationsService,
  ) {}

  @ApiCreatedResponse({ type: ResponseVehicleEvaluationDto })
  @Post(':vehicleId/evaluation')
  create(
    @Param('vehicleId', new ParseUUIDPipe()) vehicleId: string,
    @Body() createVehicleEvaluationDto: CreateVehicleEvaluationDto,
  ): Promise<ResponseVehicleEvaluationDto> {
    return this.vehicleEvaluationsService.create(
      vehicleId,
      createVehicleEvaluationDto,
    );
  }

  @Get(':vehicleId/evaluation')
  findOne(@Param('id') id: string) {
    return this.vehicleEvaluationsService.findOne(+id);
  }

  @Patch(':vehicleId/evaluation')
  update(
    @Param('id') id: string,
    @Body() updateVehicleEvaluationDto: UpdateVehicleEvaluationDto,
  ) {
    return this.vehicleEvaluationsService.update(
      +id,
      updateVehicleEvaluationDto,
    );
  }

  @Delete(':vehicleId/evaluation')
  remove(@Param('id') id: string) {
    return this.vehicleEvaluationsService.remove(+id);
  }

  // @Post('/vehicles/:vehicleId/evaluation/recalculate')
  // recalculate(@Body() createVehicleEvaluationDto: CreateVehicleEvaluationDto) {
  //   return this.vehicleEvaluationsService.recalculate(
  //     createVehicleEvaluationDto,
  //   );
  // }
}
