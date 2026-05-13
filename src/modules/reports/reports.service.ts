import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { resolveEffectivePlan } from 'src/common/plans/plan-limits';
import { PrismaService } from 'src/database/prisma.service';
import { ResponseEvaluationChecklistItemDto } from '../evaluations/dto/response-evaluation-checklist-item.dto';
import { ResponseEvaluationExpenseDto } from '../evaluations/dto/response-evaluation-expense.dto';
import { ResponseVehicleEvaluationDto } from '../evaluations/dto/response-vehicle-evaluation.dto';
import { ResponseVehicleDto } from '../vehicles/dto/response-vehicle.dto';
import { VehicleFinancialSummaryDto } from '../vehicles/dto/vehicle-financial-summary.dto';
import { VehicleImageResponseDto } from '../vehicles/images/dto/response-vehicle-image.dto';
import { VehicleReportResponseDto } from './dto/vehicle-report-response.dto';
import { Prisma } from '../../../generated/prisma/client';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getVehicleReport(
    userId: string,
    vehicleId: string,
    userRole?: string,
  ): Promise<VehicleReportResponseDto> {
    await this.ensurePremiumAccess(userId, userRole);

    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        ...(userRole === 'admin' ? {} : { userId }),
      },
      include: {
        images: {
          orderBy: { createdAt: 'desc' },
        },
        evaluation: {
          include: {
            evaluationChecklistItems: {
              orderBy: { order: 'asc' },
            },
            evaluationExpenses: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found.');
    }

    const checklistItems = vehicle.evaluation
      ? vehicle.evaluation.evaluationChecklistItems.map(
          (item) => new ResponseEvaluationChecklistItemDto(item),
        )
      : [];
    const expenses = vehicle.evaluation
      ? vehicle.evaluation.evaluationExpenses.map(
          (expense) => new ResponseEvaluationExpenseDto(expense),
        )
      : [];

    return {
      vehicle: new ResponseVehicleDto(vehicle),
      images: vehicle.images.map((image) => new VehicleImageResponseDto(image)),
      evaluation: vehicle.evaluation
        ? new ResponseVehicleEvaluationDto(vehicle.evaluation)
        : null,
      checklistItems,
      expenses,
      financialSummary: this.buildFinancialSummary(vehicle),
      generatedAt: new Date(),
    };
  }

  private async ensurePremiumAccess(
    userId: string,
    userRole?: string,
  ): Promise<void> {
    if (userRole === 'admin') {
      return;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        plan: true,
        planStatus: true,
        planExpiresAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (resolveEffectivePlan(user) !== 'premium') {
      throw new ForbiddenException(
        'Plano premium necessário para acessar este recurso.',
      );
    }
  }

  private buildFinancialSummary(vehicle: {
    id: string;
    purchasePrice: Prisma.Decimal | null;
    purchasedAt: Date | null;
    soldPrice: Prisma.Decimal | null;
    soldAt: Date | null;
    evaluation?: {
      evaluationExpenses: {
        amount: Prisma.Decimal;
      }[];
    } | null;
  }): VehicleFinancialSummaryDto {
    const purchasePrice = this.toNullableNumber(vehicle.purchasePrice);
    const soldPrice = this.toNullableNumber(vehicle.soldPrice);
    const totalExpenses = vehicle.evaluation
      ? vehicle.evaluation.evaluationExpenses.reduce(
          (sum, expense) => sum + this.toNumber(expense.amount),
          0,
        )
      : 0;
    const totalInvestment =
      this.toNumber(vehicle.purchasePrice) + totalExpenses;
    const grossProfit = soldPrice === null ? null : soldPrice - totalInvestment;
    const profitMarginPercent =
      grossProfit === null || totalInvestment <= 0
        ? null
        : (grossProfit / totalInvestment) * 100;

    return {
      vehicleId: vehicle.id,
      purchasePrice,
      purchasedAt: vehicle.purchasedAt,
      totalExpenses: this.roundMoney(totalExpenses),
      totalInvestment: this.roundMoney(totalInvestment),
      soldPrice,
      soldAt: vehicle.soldAt,
      grossProfit: grossProfit === null ? null : this.roundMoney(grossProfit),
      profitMarginPercent:
        profitMarginPercent === null
          ? null
          : Number(profitMarginPercent.toFixed(2)),
      isSold: soldPrice !== null && vehicle.soldAt !== null,
    };
  }

  private toNumber(value: Prisma.Decimal | number | string | null | undefined) {
    return value === null || value === undefined ? 0 : Number(value);
  }

  private toNullableNumber(
    value: Prisma.Decimal | number | string | null | undefined,
  ) {
    return value === null || value === undefined ? null : Number(value);
  }

  private roundMoney(value: number): number {
    return Number(value.toFixed(2));
  }
}
