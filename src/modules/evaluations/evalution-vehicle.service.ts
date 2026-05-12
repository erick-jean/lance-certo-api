import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ChecklistItemStatus,
  EvaluationRecommendation,
  EvaluationRiskLevel,
  ExpenseCategory,
  ExpenseSource,
} from 'generated/prisma/enums';
import { Prisma } from 'generated/prisma/client';
import { PrismaService } from 'src/database/prisma.service';
import { CreateEvaluationExpenseDto } from './dto/create-evaluation-expense.dto';
import { CreateVehicleEvaluationDto } from './dto/create-vehicle-evaluation.dto';
import { ResponseEvaluationChecklistItemDto } from './dto/response-evaluation-checklist-item.dto';
import { ResponseEvaluationExpenseDto } from './dto/response-evaluation-expense.dto';
import { ResponseEvalutionVehicleDto } from './dto/response-evalution-vehicle.dto';
import { UpdateEvaluationChecklistItemDto } from './dto/update-evaluation-checklist-item.dto';
import { UpdateEvaluationExpenseDto } from './dto/update-evaluation-expense.dto';
import { UpdateVehicleEvaluationDto } from './dto/update-vehicle-evaluation.dto';

@Injectable()
export class EvalutionVehicleService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    vehicleId: string,
    dto: CreateVehicleEvaluationDto,
  ): Promise<ResponseEvalutionVehicleDto> {
    return this.prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.findFirst({
        where: {
          id: vehicleId,
          userId,
        },
      });

      if (!vehicle) {
        throw new NotFoundException('Veículo não encontrado');
      }

      const existingEvaluation = await tx.vehicleEvaluation.findUnique({
        where: { vehicleId: vehicle.id },
      });

      if (existingEvaluation) {
        throw new BadRequestException('Este veículo já possui uma avaliação');
      }

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

      const evaluation = await tx.vehicleEvaluation.create({
        data: {
          vehicleId: vehicle.id,
          desiredProfitMarginPercent: dto.desiredProfitMarginPercent,
          safetyMarginPercent: dto.safetyMarginPercent,
        },
      });

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

      return new ResponseEvalutionVehicleDto(evaluation);
    });
  }

  async findByVehicleId(
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
      include: {
        vehicle: true,
        evaluationChecklistItems: {
          orderBy: { order: 'asc' },
        },
        evaluationExpenses: true,
      },
    });

    if (!evaluation) {
      throw new NotFoundException('Avaliação não encontrada');
    }

    return new ResponseEvalutionVehicleDto(evaluation);
  }

  async updateByVehicleId(
    userId: string,
    vehicleId: string,
    dto: UpdateVehicleEvaluationDto,
  ): Promise<ResponseEvalutionVehicleDto> {
    return this.prisma.$transaction(async (tx) => {
      const evaluation = await this.findEvaluationOrThrow(
        tx,
        userId,
        vehicleId,
      );

      await tx.vehicleEvaluation.update({
        where: {
          id: evaluation.id,
        },
        data: this.toEvaluationWritableData(dto),
      });

      const recalculated = await this.recalculateEvaluation(tx, evaluation.id);
      return new ResponseEvalutionVehicleDto(recalculated);
    });
  }

  async removeByVehicleId(userId: string, vehicleId: string): Promise<void> {
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
      throw new NotFoundException('Avaliação não encontrada');
    }

    await this.prisma.vehicleEvaluation.delete({
      where: {
        id: evaluation.id,
      },
    });
  }

  async findChecklistByVehicleId(
    userId: string,
    vehicleId: string,
  ): Promise<ResponseEvaluationChecklistItemDto[]> {
    const evaluation = await this.findEvaluationOrThrow(
      this.prisma,
      userId,
      vehicleId,
    );

    const items = await this.prisma.evaluationChecklistItem.findMany({
      where: {
        evaluationId: evaluation.id,
      },
      orderBy: { order: 'asc' },
    });

    return items.map((item) => new ResponseEvaluationChecklistItemDto(item));
  }

  async updateChecklistItem(
    userId: string,
    vehicleId: string,
    checklistItemId: string,
    dto: UpdateEvaluationChecklistItemDto,
  ): Promise<ResponseEvaluationChecklistItemDto> {
    return this.prisma.$transaction(async (tx) => {
      const checklistItem = await tx.evaluationChecklistItem.findFirst({
        where: {
          id: checklistItemId,
          evaluation: {
            vehicleId,
            vehicle: {
              userId,
            },
          },
        },
      });

      if (!checklistItem) {
        throw new NotFoundException('Item do checklist não encontrado');
      }

      const updatedItem = await tx.evaluationChecklistItem.update({
        where: {
          id: checklistItem.id,
        },
        data: this.toChecklistItemWritableData(dto),
      });

      if (updatedItem.status === ChecklistItemStatus.NEEDS_REPAIR) {
        const amount = this.resolveChecklistExpenseAmount(updatedItem);

        await tx.evaluationExpense.upsert({
          where: {
            evaluationId_name_source: {
              evaluationId: updatedItem.evaluationId,
              name: updatedItem.name,
              source: ExpenseSource.CHECKLIST,
            },
          },
          create: {
            evaluationId: updatedItem.evaluationId,
            category: ExpenseCategory.REPAIR,
            source: ExpenseSource.CHECKLIST,
            name: updatedItem.name,
            amount,
            isRequired: updatedItem.isRequired,
            notes: updatedItem.notes,
          },
          update: {
            category: ExpenseCategory.REPAIR,
            amount,
            isRequired: updatedItem.isRequired,
            notes: updatedItem.notes,
          },
        });
      } else {
        await tx.evaluationExpense.deleteMany({
          where: {
            evaluationId: updatedItem.evaluationId,
            source: ExpenseSource.CHECKLIST,
            name: updatedItem.name,
          },
        });
      }

      await this.recalculateEvaluation(tx, updatedItem.evaluationId);
      return new ResponseEvaluationChecklistItemDto(updatedItem);
    });
  }

  async findExpensesByVehicleId(
    userId: string,
    vehicleId: string,
  ): Promise<ResponseEvaluationExpenseDto[]> {
    const evaluation = await this.findEvaluationOrThrow(
      this.prisma,
      userId,
      vehicleId,
    );

    const expenses = await this.prisma.evaluationExpense.findMany({
      where: {
        evaluationId: evaluation.id,
      },
      orderBy: { createdAt: 'asc' },
    });

    return expenses.map((expense) => new ResponseEvaluationExpenseDto(expense));
  }

  async createExpense(
    userId: string,
    vehicleId: string,
    dto: CreateEvaluationExpenseDto,
  ): Promise<ResponseEvaluationExpenseDto> {
    return this.prisma.$transaction(async (tx) => {
      const evaluation = await this.findEvaluationOrThrow(
        tx,
        userId,
        vehicleId,
      );

      const expense = await tx.evaluationExpense.create({
        data: {
          evaluationId: evaluation.id,
          category: dto.category,
          source: ExpenseSource.USER,
          name: dto.name,
          amount: dto.amount,
          isRequired: dto.isRequired ?? false,
          notes: dto.notes,
        },
      });

      await this.recalculateEvaluation(tx, evaluation.id);
      return new ResponseEvaluationExpenseDto(expense);
    });
  }

  async updateExpense(
    userId: string,
    vehicleId: string,
    expenseId: string,
    dto: UpdateEvaluationExpenseDto,
  ): Promise<ResponseEvaluationExpenseDto> {
    return this.prisma.$transaction(async (tx) => {
      const expense = await this.findExpenseOrThrow(
        tx,
        userId,
        vehicleId,
        expenseId,
      );

      const updatedExpense = await tx.evaluationExpense.update({
        where: {
          id: expense.id,
        },
        data: this.toExpenseWritableData(dto),
      });

      await this.recalculateEvaluation(tx, updatedExpense.evaluationId);
      return new ResponseEvaluationExpenseDto(updatedExpense);
    });
  }

  async removeExpense(
    userId: string,
    vehicleId: string,
    expenseId: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const expense = await this.findExpenseOrThrow(
        tx,
        userId,
        vehicleId,
        expenseId,
      );

      await tx.evaluationExpense.delete({
        where: {
          id: expense.id,
        },
      });

      await this.recalculateEvaluation(tx, expense.evaluationId);
    });
  }

  private async findEvaluationOrThrow(
    tx: any,
    userId: string,
    vehicleId: string,
  ) {
    const evaluation = await tx.vehicleEvaluation.findFirst({
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
      throw new NotFoundException('Avaliação não encontrada');
    }

    return evaluation;
  }

  private async findExpenseOrThrow(
    tx: any,
    userId: string,
    vehicleId: string,
    expenseId: string,
  ) {
    const expense = await tx.evaluationExpense.findFirst({
      where: {
        id: expenseId,
        evaluation: {
          vehicleId,
          vehicle: {
            userId,
          },
        },
      },
      select: {
        id: true,
        evaluationId: true,
      },
    });

    if (!expense) {
      throw new NotFoundException('Gasto da avaliação não encontrado');
    }

    return expense;
  }

  private async recalculateEvaluation(tx: any, evaluationId: string) {
    const evaluation = await tx.vehicleEvaluation.findUnique({
      where: {
        id: evaluationId,
      },
      include: {
        vehicle: true,
        evaluationChecklistItems: true,
        evaluationExpenses: true,
      },
    });

    if (!evaluation) {
      throw new NotFoundException('Avaliação não encontrada');
    }

    const marketValue = this.toNumber(
      evaluation.vehicle.marketValue ?? evaluation.vehicle.fipeValue,
    );
    const currentBid = this.toNumber(
      evaluation.vehicle.auctionCurrentBid ??
        evaluation.vehicle.auctionInitialBid,
    );
    const expensesTotal = evaluation.evaluationExpenses.reduce(
      (sum, expense) => sum + this.toNumber(expense.amount),
      0,
    );
    const desiredMargin =
      this.toNumber(evaluation.desiredProfitMarginPercent) / 100;
    const safetyMargin = this.toNumber(evaluation.safetyMarginPercent) / 100;
    const desiredProfit = marketValue * desiredMargin;
    const safetyReserve = marketValue * safetyMargin;
    const estimatedFinalCost = currentBid + expensesTotal;
    const estimatedProfit =
      marketValue === 0 ? null : marketValue - estimatedFinalCost;
    const maxRecommendedBid =
      marketValue === 0
        ? null
        : marketValue - expensesTotal - desiredProfit - safetyReserve;
    const requiredChecklistItems = evaluation.evaluationChecklistItems.filter(
      (item) => item.isRequired,
    );
    const isComplete =
      requiredChecklistItems.length === 0 ||
      requiredChecklistItems.every(
        (item) => item.status !== ChecklistItemStatus.NOT_CHECKED,
      );

    const updatedEvaluation = await tx.vehicleEvaluation.update({
      where: {
        id: evaluation.id,
      },
      data: {
        maxRecommendedBid: this.toDecimalOrNull(maxRecommendedBid),
        estimatedFinalCost: this.toDecimalOrNull(estimatedFinalCost),
        estimatedProfit: this.toDecimalOrNull(estimatedProfit),
        riskLevel: this.resolveRiskLevel(estimatedProfit, marketValue),
        recommendation: this.resolveRecommendation(
          estimatedProfit,
          desiredProfit,
        ),
        isComplete,
        lastCalculatedAt: new Date(),
      },
      include: {
        vehicle: true,
        evaluationChecklistItems: {
          orderBy: { order: 'asc' },
        },
        evaluationExpenses: true,
      },
    });

    return updatedEvaluation;
  }

  private toEvaluationWritableData(dto: UpdateVehicleEvaluationDto) {
    const data: Prisma.VehicleEvaluationUpdateInput = {};

    if (dto.desiredProfitMarginPercent !== undefined) {
      data.desiredProfitMarginPercent = dto.desiredProfitMarginPercent;
    }

    if (dto.safetyMarginPercent !== undefined) {
      data.safetyMarginPercent = dto.safetyMarginPercent;
    }

    return data;
  }

  private toChecklistItemWritableData(dto: UpdateEvaluationChecklistItemDto) {
    const data: Prisma.EvaluationChecklistItemUpdateInput = {};

    if (dto.status !== undefined) {
      data.status = dto.status;
      data.answeredAt = new Date();
    }

    if (dto.quantity !== undefined) {
      data.quantity = dto.quantity;
    }

    if (dto.estimatedUnitCost !== undefined) {
      data.estimatedUnitCost = dto.estimatedUnitCost;
    }

    if (dto.estimatedTotalCost !== undefined) {
      data.estimatedTotalCost = dto.estimatedTotalCost;
    }

    if (dto.notes !== undefined) {
      data.notes = dto.notes;
    }

    return data;
  }

  private toExpenseWritableData(dto: UpdateEvaluationExpenseDto) {
    const data: Prisma.EvaluationExpenseUpdateInput = {};

    if (dto.category !== undefined) {
      data.category = dto.category;
    }

    if (dto.name !== undefined) {
      data.name = dto.name;
    }

    if (dto.amount !== undefined) {
      data.amount = dto.amount;
    }

    if (dto.isRequired !== undefined) {
      data.isRequired = dto.isRequired;
    }

    if (dto.notes !== undefined) {
      data.notes = dto.notes;
    }

    return data;
  }

  private resolveChecklistExpenseAmount(item: {
    quantity: number;
    estimatedUnitCost: Prisma.Decimal | null;
    estimatedTotalCost: Prisma.Decimal | null;
  }) {
    const total = this.toNumber(item.estimatedTotalCost);

    if (total > 0) {
      return total;
    }

    return item.quantity * this.toNumber(item.estimatedUnitCost);
  }

  private toNumber(value: Prisma.Decimal | number | string | null | undefined) {
    return value === null || value === undefined ? 0 : Number(value);
  }

  private toDecimalOrNull(value: number | null) {
    if (value === null || !Number.isFinite(value)) {
      return null;
    }

    return Number(value.toFixed(2));
  }

  private resolveRiskLevel(
    estimatedProfit: number | null,
    marketValue: number,
  ): EvaluationRiskLevel | null {
    if (estimatedProfit === null || marketValue === 0) {
      return null;
    }

    const profitRatio = estimatedProfit / marketValue;

    if (profitRatio >= 0.15) {
      return EvaluationRiskLevel.LOW;
    }

    if (profitRatio >= 0.05) {
      return EvaluationRiskLevel.MEDIUM;
    }

    return EvaluationRiskLevel.HIGH;
  }

  private resolveRecommendation(
    estimatedProfit: number | null,
    desiredProfit: number,
  ): EvaluationRecommendation | null {
    if (estimatedProfit === null) {
      return null;
    }

    if (estimatedProfit >= desiredProfit) {
      return EvaluationRecommendation.RECOMMENDED;
    }

    if (estimatedProfit > 0) {
      return EvaluationRecommendation.CAUTION;
    }

    return EvaluationRecommendation.NOT_RECOMMENDED;
  }
}
