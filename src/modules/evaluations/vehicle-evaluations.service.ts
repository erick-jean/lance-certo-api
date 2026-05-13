import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ChecklistSeverity,
  ChecklistItemStatus,
  EvaluationRecommendation,
  EvaluationRiskLevel,
  ExpenseCategory,
  ExpenseSource,
} from 'generated/prisma/enums';
import { Prisma } from 'generated/prisma/client';
import { PlanName, resolveEffectivePlan } from 'src/common/plans/plan-limits';
import { PrismaService } from 'src/database/prisma.service';
import { CreateEvaluationExpenseDto } from './dto/create-evaluation-expense.dto';
import { CreateVehicleEvaluationDto } from './dto/create-vehicle-evaluation.dto';
import { ResponseEvaluationChecklistItemDto } from './dto/response-evaluation-checklist-item.dto';
import { ResponseEvaluationExpenseDto } from './dto/response-evaluation-expense.dto';
import { ResponseVehicleEvaluationDto } from './dto/response-vehicle-evaluation.dto';
import { UpdateEvaluationChecklistItemDto } from './dto/update-evaluation-checklist-item.dto';
import { UpdateEvaluationExpenseDto } from './dto/update-evaluation-expense.dto';
import { UpdateVehicleEvaluationDto } from './dto/update-vehicle-evaluation.dto';

type EvaluationPrismaClient = Pick<
  PrismaService,
  | 'user'
  | 'vehicle'
  | 'vehicleEvaluation'
  | 'checklistTemplate'
  | 'evaluationChecklistItem'
  | 'evaluationExpense'
>;

type ChecklistTemplateItemSnapshotSource = {
  id: string;
  category: string;
  name: string;
  question: string | null;
  severity: ChecklistSeverity;
  requiresQuantity: boolean;
  isRequired: boolean;
  isPremiumOnly: boolean;
  order: number;
  defaultEstimatedCost: Prisma.Decimal | null;
};

type UserPlanSource = {
  role: string;
  plan: string;
  planStatus: string;
  planExpiresAt: Date | null;
};

const FREE_DEFAULT_DESIRED_PROFIT_MARGIN_PERCENT = 15;
const FREE_DEFAULT_SAFETY_MARGIN_PERCENT = 5;
const PREMIUM_EXPENSES_REQUIRED_MESSAGE =
  'Plano premium necessário para gerenciar despesas da avaliação.';

type EvaluationChecklistItemExpenseSource = {
  evaluationId: string;
  name: string;
  quantity: number;
  estimatedUnitCost: Prisma.Decimal | null;
  estimatedTotalCost: Prisma.Decimal | null;
  isRequired: boolean;
  notes: string | null;
  status: ChecklistItemStatus;
};

@Injectable()
export class VehicleEvaluationsService {
  constructor(private readonly prisma: PrismaService) {}

  async createEvaluationForVehicle(
    userId: string,
    vehicleId: string,
    dto: CreateVehicleEvaluationDto,
  ): Promise<ResponseVehicleEvaluationDto> {
    /**
     * The evaluation and its checklist items must be created atomically.
     */
    return this.prisma.$transaction(async (tx) => {
      const userPlan = await this.getUserPlan(tx, userId);
      const effectivePlan = this.resolveFeaturePlan(userPlan);

      /**
       * Scope the vehicle lookup by userId to prevent cross-user access.
       */
      const vehicle = await this.findVehicleOwnedByUserOrThrow(
        tx,
        userId,
        vehicleId,
      );

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

      const availableTemplateItems =
        effectivePlan === 'premium'
          ? template.items
          : template.items.filter((item) => !item.isPremiumOnly);

      if (availableTemplateItems.length === 0) {
        throw new BadRequestException(
          'Checklist disponível para seu plano não possui itens.',
        );
      }

      /**
       * The evaluation is created before checklist items because they reference
       * its id.
       */
      const marginData = this.resolveInitialMarginData(effectivePlan, dto);
      const evaluation = await tx.vehicleEvaluation.create({
        data: {
          vehicleId: vehicle.id,
          desiredProfitMarginPercent: marginData.desiredProfitMarginPercent,
          safetyMarginPercent: marginData.safetyMarginPercent,
        },
      });

      /**
       * Snapshot the active checklist template into this evaluation.
       * This preserves historical evaluation data even if the template changes later.
       */
      await this.createChecklistSnapshotForEvaluation(
        tx,
        evaluation.id,
        availableTemplateItems,
      );

      return new ResponseVehicleEvaluationDto(evaluation);
    });
  }

  async findEvaluationByVehicleId(
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

    return new ResponseVehicleEvaluationDto(evaluation);
  }

  async updateEvaluationMargins(
    userId: string,
    vehicleId: string,
    dto: UpdateVehicleEvaluationDto,
  ): Promise<ResponseVehicleEvaluationDto> {
    return this.prisma.$transaction(async (tx) => {
      const userPlan = await this.getUserPlan(tx, userId);
      this.ensurePremiumFeature(
        userPlan,
        'Plano premium necessário para personalizar margens.',
      );

      const evaluation = await this.findEvaluationForUserVehicleOrThrow(
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

      /**
       * Financial results depend on margins, so the evaluation must be
       * recalculated after margin changes.
       */
      const recalculated = await this.recalculateEvaluationFinancials(
        tx,
        evaluation.id,
      );
      return new ResponseVehicleEvaluationDto(recalculated);
    });
  }

  async deleteEvaluationByVehicleId(
    userId: string,
    vehicleId: string,
  ): Promise<void> {
    const evaluation = await this.findEvaluationForUserVehicleOrThrow(
      this.prisma,
      userId,
      vehicleId,
    );

    /**
     * Deleting the evaluation cascades checklist items and expenses through
     * database relations.
     */
    await this.prisma.vehicleEvaluation.delete({
      where: {
        id: evaluation.id,
      },
    });
  }

  async getChecklistByVehicleId(
    userId: string,
    vehicleId: string,
  ): Promise<ResponseEvaluationChecklistItemDto[]> {
    const evaluation = await this.findEvaluationForUserVehicleOrThrow(
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

  async updateChecklistItemAnswer(
    userId: string,
    vehicleId: string,
    checklistItemId: string,
    dto: UpdateEvaluationChecklistItemDto,
  ): Promise<ResponseEvaluationChecklistItemDto> {
    return this.prisma.$transaction(async (tx) => {
      /**
       * Scope the checklist item through evaluation and vehicle ownership.
       */
      const checklistItem = await this.findChecklistItemForUserVehicleOrThrow(
        tx,
        userId,
        vehicleId,
        checklistItemId,
      );

      const updatedItem = await tx.evaluationChecklistItem.update({
        where: {
          id: checklistItem.id,
        },
        data: this.toChecklistItemWritableData(dto),
      });

      /**
       * Checklist answers drive derived expenses. Repair items create or update
       * expenses; non-repair statuses remove them.
       */
      await this.syncChecklistDerivedExpense(tx, updatedItem);

      /**
       * Financial results depend on expenses, so the evaluation must be
       * recalculated after checklist-derived expenses change.
       */
      await this.recalculateEvaluationFinancials(tx, updatedItem.evaluationId);
      return new ResponseEvaluationChecklistItemDto(updatedItem);
    });
  }

  async listEvaluationExpenses(
    userId: string,
    vehicleId: string,
  ): Promise<ResponseEvaluationExpenseDto[]> {
    const userPlan = await this.getUserPlan(this.prisma, userId);
    this.ensurePremiumFeature(userPlan, PREMIUM_EXPENSES_REQUIRED_MESSAGE);

    const evaluation = await this.findEvaluationForUserVehicleOrThrow(
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

  async createManualEvaluationExpense(
    userId: string,
    vehicleId: string,
    dto: CreateEvaluationExpenseDto,
  ): Promise<ResponseEvaluationExpenseDto> {
    return this.prisma.$transaction(async (tx) => {
      const userPlan = await this.getUserPlan(tx, userId);
      this.ensurePremiumFeature(userPlan, PREMIUM_EXPENSES_REQUIRED_MESSAGE);

      const evaluation = await this.findEvaluationForUserVehicleOrThrow(
        tx,
        userId,
        vehicleId,
      );

      /**
       * Manual expenses are user-provided and are not tied to checklist answers.
       */
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

      /**
       * Financial results depend on expenses, so the evaluation must be
       * recalculated after manual expense changes.
       */
      await this.recalculateEvaluationFinancials(tx, evaluation.id);
      return new ResponseEvaluationExpenseDto(expense);
    });
  }

  async updateManualEvaluationExpense(
    userId: string,
    vehicleId: string,
    expenseId: string,
    dto: UpdateEvaluationExpenseDto,
  ): Promise<ResponseEvaluationExpenseDto> {
    return this.prisma.$transaction(async (tx) => {
      const userPlan = await this.getUserPlan(tx, userId);
      this.ensurePremiumFeature(userPlan, PREMIUM_EXPENSES_REQUIRED_MESSAGE);

      const expense = await this.findExpenseForUserVehicleOrThrow(
        tx,
        userId,
        vehicleId,
        expenseId,
      );
      this.ensureManualExpense(expense);

      const updatedExpense = await tx.evaluationExpense.update({
        where: {
          id: expense.id,
        },
        data: this.toExpenseWritableData(dto),
      });

      /**
       * Financial results depend on expenses, so the evaluation must be
       * recalculated after expense updates.
       */
      await this.recalculateEvaluationFinancials(
        tx,
        updatedExpense.evaluationId,
      );
      return new ResponseEvaluationExpenseDto(updatedExpense);
    });
  }

  async deleteManualEvaluationExpense(
    userId: string,
    vehicleId: string,
    expenseId: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const userPlan = await this.getUserPlan(tx, userId);
      this.ensurePremiumFeature(userPlan, PREMIUM_EXPENSES_REQUIRED_MESSAGE);

      const expense = await this.findExpenseForUserVehicleOrThrow(
        tx,
        userId,
        vehicleId,
        expenseId,
      );
      this.ensureManualExpense(expense);

      await tx.evaluationExpense.delete({
        where: {
          id: expense.id,
        },
      });

      /**
       * Financial results depend on expenses, so the evaluation must be
       * recalculated after expense deletion.
       */
      await this.recalculateEvaluationFinancials(tx, expense.evaluationId);
    });
  }

  private async getUserPlan(tx: EvaluationPrismaClient, userId: string) {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: {
        plan: true,
        planStatus: true,
        planExpiresAt: true,
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  private resolveFeaturePlan(user: UserPlanSource): PlanName {
    return user.role === 'admin' ? 'premium' : resolveEffectivePlan(user);
  }

  private ensurePremiumFeature(
    user: UserPlanSource,
    forbiddenMessage: string,
  ): void {
    if (this.resolveFeaturePlan(user) !== 'premium') {
      throw new ForbiddenException(forbiddenMessage);
    }
  }

  private resolveInitialMarginData(
    effectivePlan: PlanName,
    dto: CreateVehicleEvaluationDto,
  ) {
    if (effectivePlan === 'premium') {
      return {
        desiredProfitMarginPercent: dto.desiredProfitMarginPercent,
        safetyMarginPercent: dto.safetyMarginPercent,
      };
    }

    return {
      desiredProfitMarginPercent: FREE_DEFAULT_DESIRED_PROFIT_MARGIN_PERCENT,
      safetyMarginPercent: FREE_DEFAULT_SAFETY_MARGIN_PERCENT,
    };
  }

  private async findVehicleOwnedByUserOrThrow(
    tx: EvaluationPrismaClient,
    userId: string,
    vehicleId: string,
  ) {
    const vehicle = await tx.vehicle.findFirst({
      where: {
        id: vehicleId,
        userId,
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Veículo não encontrado');
    }

    return vehicle;
  }

  private async findEvaluationForUserVehicleOrThrow(
    tx: EvaluationPrismaClient,
    userId: string,
    vehicleId: string,
  ) {
    /**
     * Scope the evaluation lookup by userId to prevent cross-user access.
     */
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

  private async findChecklistItemForUserVehicleOrThrow(
    tx: EvaluationPrismaClient,
    userId: string,
    vehicleId: string,
    checklistItemId: string,
  ) {
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

    return checklistItem;
  }

  private async findExpenseForUserVehicleOrThrow(
    tx: EvaluationPrismaClient,
    userId: string,
    vehicleId: string,
    expenseId: string,
  ) {
    /**
     * Scope the expense through evaluation and vehicle ownership.
     */
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
        source: true,
      },
    });

    if (!expense) {
      throw new NotFoundException('Gasto da avaliação não encontrado');
    }

    return expense;
  }

  private async createChecklistSnapshotForEvaluation(
    tx: EvaluationPrismaClient,
    evaluationId: string,
    checklistTemplateItems: ChecklistTemplateItemSnapshotSource[],
  ) {
    await tx.evaluationChecklistItem.createMany({
      data: checklistTemplateItems.map((checklistTemplateItem) => ({
        evaluationId,
        templateItemId: checklistTemplateItem.id,
        category: checklistTemplateItem.category,
        name: checklistTemplateItem.name,
        question: checklistTemplateItem.question,
        severity: checklistTemplateItem.severity,
        requiresQuantity: checklistTemplateItem.requiresQuantity,
        isRequired: checklistTemplateItem.isRequired,
        order: checklistTemplateItem.order,
        status: ChecklistItemStatus.NOT_CHECKED,
        quantity: 1,
        estimatedUnitCost: checklistTemplateItem.defaultEstimatedCost,
        estimatedTotalCost: null,
        notes: null,
        answeredAt: null,
      })),
    });
  }

  private async syncChecklistDerivedExpense(
    tx: EvaluationPrismaClient,
    checklistItem: EvaluationChecklistItemExpenseSource,
  ) {
    if (checklistItem.status !== ChecklistItemStatus.NEEDS_REPAIR) {
      await this.removeChecklistDerivedExpense(tx, checklistItem);
      return;
    }

    await this.upsertChecklistDerivedExpense(tx, checklistItem);
  }

  private async upsertChecklistDerivedExpense(
    tx: EvaluationPrismaClient,
    checklistItem: EvaluationChecklistItemExpenseSource,
  ) {
    const amount = this.resolveChecklistExpenseAmount(checklistItem);

    await tx.evaluationExpense.upsert({
      where: {
        evaluationId_name_source: {
          evaluationId: checklistItem.evaluationId,
          name: checklistItem.name,
          source: ExpenseSource.CHECKLIST,
        },
      },
      create: {
        evaluationId: checklistItem.evaluationId,
        category: ExpenseCategory.REPAIR,
        source: ExpenseSource.CHECKLIST,
        name: checklistItem.name,
        amount,
        isRequired: checklistItem.isRequired,
        notes: checklistItem.notes,
      },
      update: {
        category: ExpenseCategory.REPAIR,
        amount,
        isRequired: checklistItem.isRequired,
        notes: checklistItem.notes,
      },
    });
  }

  private async removeChecklistDerivedExpense(
    tx: EvaluationPrismaClient,
    checklistItem: EvaluationChecklistItemExpenseSource,
  ) {
    await tx.evaluationExpense.deleteMany({
      where: {
        evaluationId: checklistItem.evaluationId,
        source: ExpenseSource.CHECKLIST,
        name: checklistItem.name,
      },
    });
  }

  private ensureManualExpense(expense: { source: ExpenseSource }) {
    if (expense.source !== ExpenseSource.USER) {
      throw new BadRequestException(
        'Somente gastos manuais podem ser alterados por esta rota',
      );
    }
  }

  private async recalculateEvaluationFinancials(
    tx: EvaluationPrismaClient,
    evaluationId: string,
  ) {
    /**
     * Recalculation uses the latest vehicle values, checklist status and all
     * expenses to keep the evaluation summary consistent.
     */
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
    const totalExpensesAmount = evaluation.evaluationExpenses.reduce(
      (sum, expense) => sum + this.toNumber(expense.amount),
      0,
    );
    const desiredMargin =
      this.toNumber(evaluation.desiredProfitMarginPercent) / 100;
    const safetyMargin = this.toNumber(evaluation.safetyMarginPercent) / 100;
    const desiredProfitAmount = marketValue * desiredMargin;
    const safetyMarginAmount = marketValue * safetyMargin;
    const estimatedFinalCost = currentBid + totalExpensesAmount;
    const estimatedProfit =
      marketValue === 0 ? null : marketValue - estimatedFinalCost;
    const maxRecommendedBid =
      marketValue === 0
        ? null
        : marketValue -
          totalExpensesAmount -
          desiredProfitAmount -
          safetyMarginAmount;
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
          desiredProfitAmount,
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
    /**
     * Checklist expenses prefer explicit total cost; otherwise quantity and
     * unit cost are multiplied.
     */
    const explicitTotalCost = this.toNumber(item.estimatedTotalCost);

    if (explicitTotalCost > 0) {
      return explicitTotalCost;
    }

    return item.quantity * this.toNumber(item.estimatedUnitCost);
  }

  private toNumber(value: Prisma.Decimal | number | string | null | undefined) {
    /**
     * Prisma Decimal values are converted to numbers for financial formulas.
     */
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
