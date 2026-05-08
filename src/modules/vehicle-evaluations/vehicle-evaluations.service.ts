import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateVehicleEvaluationDto } from './dto/create-vehicle-evaluation.dto';
import { UpdateVehicleEvaluationDto } from './dto/update-vehicle-evaluation.dto';
import { ResponseVehicleEvaluationDto } from './dto/response-vehicle-evaluation.dto';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class VehicleEvaluationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    vehicleId: string,
    dto: CreateVehicleEvaluationDto,
  ): Promise<ResponseVehicleEvaluationDto> {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        userId,
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found.');
    }

    const vehicleEvaluation = await this.prisma.vehicleEvaluation.findFirst({
      where: { vehicleId: vehicleId },
    });

    // Verifica se já tem uma avalição do veiculo
    // if (vehicleEvaluation) {
    //   throw new ConflictException(
    //     'Já existe uma avaliação cadastrado para esse veiculo.',
    //   );
    // }

    const totalCosts =
      Number(dto.estimatedRepairCost ?? 0) +
      Number(dto.auctionFees ?? 0) +
      Number(dto.documentationCost ?? 0) +
      Number(dto.transportCost ?? 0) +
      Number(dto.inspectionCost ?? 0);

    const marketValue = vehicle.marketValue
      ? Number(vehicle.marketValue)
      : null;

    const fipeValue = vehicle.fipeValue ? Number(vehicle.fipeValue) : null;

    const isComplete = Boolean(marketValue || fipeValue);

    const baseValue = marketValue ?? fipeValue ?? 0;

    const desiredProfitMarginPercent =
      baseValue * (Number(dto.desiredProfitMarginPercent ?? 0) / 100);

    const safetyMarginPercent =
      baseValue * (Number(dto.safetyMarginPercent ?? 0) / 100);

    const evaluation = await this.prisma.vehicleEvaluation.create({
      data: { vehicleId, ...dto },
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
