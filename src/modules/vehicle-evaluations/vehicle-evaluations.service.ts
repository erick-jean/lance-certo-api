import { ConflictException, Injectable } from '@nestjs/common';
import { CreateVehicleEvaluationDto } from './dto/create-vehicle-evaluation.dto';
import { UpdateVehicleEvaluationDto } from './dto/update-vehicle-evaluation.dto';
import { ResponseVehicleEvaluationDto } from './dto/response-vehicle-evaluation.dto';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class VehicleEvaluationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    // userId: string,
    vehicleId: string,
    createVehicleEvaluationDto: CreateVehicleEvaluationDto,
  ): Promise<ResponseVehicleEvaluationDto> {
    const vehicleEvaluation = await this.prisma.vehicleEvaluation.findFirst({
      where: { vehicleId: vehicleId },
    });
    if (vehicleEvaluation) {
      throw new ConflictException(
        'Já existe uma avaliação cadastrado para esse veiculo.',
      );
    }

    const evaluation = await this.prisma.vehicleEvaluation.create({
      data: { vehicleId, ...createVehicleEvaluationDto },
    });

    return new ResponseVehicleEvaluationDto(evaluation);
  }

  findOne(id: number) {
    return `This action returns a #${id} vehicleEvaluation`;
  }

  update(id: number, _updateVehicleEvaluationDto: UpdateVehicleEvaluationDto) {
    void _updateVehicleEvaluationDto;
    return `This action updates a #${id} vehicleEvaluation`;
  }

  remove(id: number) {
    return `This action removes a #${id} vehicleEvaluation`;
  }

  recalculate(id: number) {
    return `This action returns a #${id} vehicleEvaluation`;
  }
}
