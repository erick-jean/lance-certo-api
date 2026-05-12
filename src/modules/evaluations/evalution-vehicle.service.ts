import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateEvalutionVehicleDto } from './dto/create-evalution-vehicle.dto';
import { UpdateEvalutionVehicleDto } from './dto/update-evalution-vehicle.dto';
import { ResponseEvalutionVehicleDto } from './dto/response-evalution-vehicle.dto';
import { PrismaService } from 'src/database/prisma.service';
import { ChecklistItemStatus } from 'generated/prisma/enums';

@Injectable()
export class EvalutionVehicleService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    vehicleId: string,
    dto: CreateEvalutionVehicleDto,
  ): Promise<ResponseEvalutionVehicleDto> {
    return this.prisma.$transaction(async (tx) => {
      /**
       * Busca o veículo garantindo que ele pertence ao usuário autenticado.
       * Isso evita que um usuário crie avaliação para veículo de outro usuário.
       */
      const vehicle = await tx.vehicle.findFirst({
        where: {
          id: vehicleId,
          userId,
        },
      });

      if (!vehicle) {
        throw new NotFoundException('Veículo não encontrado');
      }

      /**
       * Cada veículo pode ter apenas uma avaliação.
       * Essa regra também é protegida no banco pelo @unique em vehicleId.
       */
      const existingEvaluation = await tx.vehicleEvaluation.findUnique({
        where: { vehicleId: vehicle.id },
      });

      if (existingEvaluation) {
        throw new BadRequestException('Este veículo já possui uma avaliação');
      }

      /**
       * Busca o checklist padrão ativo de acordo com o tipo do veículo.
       * Exemplo:
       * - CAR -> Checklist padrão carro
       * - MOTORCYCLE -> Checklist padrão moto
       */
      const template = await tx.checklistTemplate.findFirst({
        where: {
          vehicleType: vehicle.type,
          isActive: true,
        },
        include: {
          items: {
            orderBy: { order: 'asc' },
          },
        },
      });

      if (!template) {
        throw new BadRequestException(
          `Nenhum checklist ativo encontrado para o tipo ${vehicle.type}`,
        );
      }

      if (template.items.length === 0) {
        throw new BadRequestException(
          `Checklist ativo para o tipo ${vehicle.type} não possui itens`,
        );
      }

      /**
       * Cria a avaliação principal do veículo.
       * Nesta etapa ainda não existem gastos nem respostas do checklist.
       */
      const evaluation = await tx.vehicleEvaluation.create({
        data: {
          vehicleId: vehicle.id,
          desiredProfitMarginPercent: dto.desiredProfitMarginPercent,
          safetyMarginPercent: dto.safetyMarginPercent,
        },
      });

      /**
       * Copia os itens do template para a avaliação.
       *
       * Importante:
       * EvaluationChecklistItem é um snapshot do ChecklistTemplateItem.
       * Assim, se o admin alterar o template no futuro, avaliações antigas
       * continuam preservando as perguntas, custos e regras usadas na época.
       */
      await tx.evaluationChecklistItem.createMany({
        data: template.items.map((item) => ({
          evaluationId: evaluation.id,
          templateItemId: item.id,

          category: item.category,
          name: item.name,
          question: item.question,

          severity: item.severity,
          requiresQuantity: item.requiresQuantity,
          isRequired: item.isRequired,
          order: item.order,

          status: ChecklistItemStatus.NOT_CHECKED,

          quantity: 1,
          estimatedUnitCost: item.defaultEstimatedCost,
          estimatedTotalCost: null,

          notes: null,
          answeredAt: null,
        })),
      });

      /**
       * A rota de criação retorna apenas o resumo da avaliação.
       * O checklist fica pronto no banco e pode ser consultado em uma rota
       * específica, evitando uma resposta gigante logo após o POST.
       */
      return new ResponseEvalutionVehicleDto(evaluation);
    });
  }

  async findOne(
    userId: string,
    vehicleId: string,
  ): Promise<ResponseEvalutionVehicleDto> {
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

    return new ResponseEvalutionVehicleDto(evaluation);
  }

  async update(
    userId: string,
    vehicleId: string,
    updateEvalutionVehicleDto: UpdateEvalutionVehicleDto,
  ): Promise<ResponseEvalutionVehicleDto> {
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
      data: this.toEvaluationWritableData(updateEvalutionVehicleDto),
    });

    return new ResponseEvalutionVehicleDto(updatedEvaluation);
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
    dto: CreateEvalutionVehicleDto | UpdateEvalutionVehicleDto,
  ) {
    return {
      desiredProfitMarginPercent: dto.desiredProfitMarginPercent,
      safetyMarginPercent: dto.safetyMarginPercent,
    };
  }
}
