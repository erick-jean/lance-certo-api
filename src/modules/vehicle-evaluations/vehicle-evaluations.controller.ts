import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { VehicleEvaluationsService } from './vehicle-evaluations.service';
import { CreateVehicleEvaluationDto } from './dto/create-vehicle-evaluation.dto';
import { UpdateVehicleEvaluationDto } from './dto/update-vehicle-evaluation.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Vehicle Evaluation / Avaliação do veículo')
@Controller('vehicle')
export class VehicleEvaluationsController {
  constructor(
    private readonly vehicleEvaluationsService: VehicleEvaluationsService,
  ) {}

  @Post(':vehicleId/evaluation')
  create(@Body() createVehicleEvaluationDto: CreateVehicleEvaluationDto) {
    return this.vehicleEvaluationsService.create(createVehicleEvaluationDto);
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

  @Post('/vehicles/:vehicleId/evaluation/recalculate')
  recalculate(@Body() createVehicleEvaluationDto: CreateVehicleEvaluationDto) {
    return this.vehicleEvaluationsService.create(createVehicleEvaluationDto);
  }
}
