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
      where: { vehicleId },
    });

    if (vehicleEvaluation) {
      throw new ConflictException(
        'There is already a review registered for this vehicle.',
      );
    }

    const checklistTemplate = await this.prisma.checklistTemplate.findFirst({
      where: {
        vehicleType: vehicle.type,
        isActive: true,
      },
      include: {
        items: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!checklistTemplate) {
      throw new NotFoundException(
        `Checklist template not found for vehicle type ${vehicle.type}.`,
      );
    }

    const evaluation = await this.prisma.$transaction(async (tx) => {
      const createdEvaluation = await tx.vehicleEvaluation.create({
        data: {
          vehicleId,
          ...this.toEvaluationWritableData(dto),
        },
      });

      await tx.evaluationChecklistItem.createMany({
        data: checklistTemplate.items.map((item) => ({
          evaluationId: createdEvaluation.id,
          templateItemId: item.id,
          category: item.category,
          name: item.name,
          status: 'NOT_CHECKED',
          quantity: 1,
          estimatedUnitCost: item.defaultEstimatedCost,
          estimatedTotalCost: null,
        })),
      });

      return createdEvaluation;
    });

    return new ResponseVehicleEvaluationDto(evaluation);
  }

  async findOne(
    userId: string,
    vehicleId: string,
  ): Promise<ResponseVehicleEvaluationDto> {
    const evaluation = await this.prisma.vehicleEvaluation.findFirst({
      where: {
        vehicleId,
        vehicle: {
          userId,
        },
      },
    });

    if (!evaluation) {
      throw new NotFoundException('Vehicle evaluation not found.');
    }

    return new ResponseVehicleEvaluationDto(evaluation);
  }

  async update(
    userId: string,
    vehicleId: string,
    updateVehicleEvaluationDto: UpdateVehicleEvaluationDto,
  ): Promise<ResponseVehicleEvaluationDto> {
    const evaluation = await this.prisma.vehicleEvaluation.findFirst({
      where: {
        vehicleId,
        vehicle: {
          userId,
        },
      },
      select: {
        id: true,
      },
    });

    if (!evaluation) {
      throw new NotFoundException('Vehicle evaluation not found.');
    }

    const updatedEvaluation = await this.prisma.vehicleEvaluation.update({
      where: {
        id: evaluation.id,
      },
      data: this.toEvaluationWritableData(updateVehicleEvaluationDto),
    });

    return new ResponseVehicleEvaluationDto(updatedEvaluation);
  }

  async remove(userId: string, vehicleId: string): Promise<void> {
    const evaluation = await this.prisma.vehicleEvaluation.findFirst({
      where: {
        vehicleId,
        vehicle: {
          userId,
        },
      },
      select: {
        id: true,
      },
    });

    if (!evaluation) {
      throw new NotFoundException('Vehicle evaluation not found.');
    }

    await this.prisma.vehicleEvaluation.delete({
      where: {
        id: evaluation.id,
      },
    });
  }

  recalculate(id: number) {
    return `This action returns a #${id} vehicleEvaluation`;
  }

  private toEvaluationWritableData(
    dto: CreateVehicleEvaluationDto | UpdateVehicleEvaluationDto,
  ) {
    return {
      desiredProfitMarginPercent: dto.desiredProfitMarginPercent,
      safetyMarginPercent: dto.safetyMarginPercent,
    };
  }
}
