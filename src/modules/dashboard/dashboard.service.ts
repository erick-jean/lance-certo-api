import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PLAN_LIMITS,
  resolveEffectivePlan,
} from 'src/common/plans/plan-limits';
import { PrismaService } from 'src/database/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { VehicleStatus } from '../../../generated/prisma/enums';
import { DashboardFinancialResponseDto } from './dto/dashboard-financial-response.dto';
import { DashboardSummaryResponseDto } from './dto/dashboard-summary-response.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(userId: string): Promise<DashboardSummaryResponseDto> {
    const user = await this.findUserPlanOrThrow(userId);
    const effectivePlan =
      user.role === 'admin' ? 'premium' : resolveEffectivePlan(user);
    const limits = PLAN_LIMITS[effectivePlan];

    const [
      totalVehicles,
      analyzingVehicles,
      rejectedVehicles,
      purchasedVehicles,
      soldVehicles,
    ] = await this.prisma.$transaction([
      this.prisma.vehicle.count({ where: { userId } }),
      this.prisma.vehicle.count({
        where: { userId, status: VehicleStatus.ANALYZING },
      }),
      this.prisma.vehicle.count({
        where: { userId, status: VehicleStatus.REJECTED },
      }),
      this.prisma.vehicle.count({
        where: { userId, status: VehicleStatus.PURCHASED },
      }),
      this.prisma.vehicle.count({
        where: { userId, status: VehicleStatus.SOLD },
      }),
    ]);

    const remainingVehicles =
      limits.maxVehicles === null
        ? null
        : Math.max(limits.maxVehicles - totalVehicles, 0);

    return {
      totalVehicles,
      analyzingVehicles,
      rejectedVehicles,
      purchasedVehicles,
      soldVehicles,
      plan: user.plan,
      vehicleLimit: limits.maxVehicles,
      remainingVehicles,
    };
  }

  async getFinancial(userId: string): Promise<DashboardFinancialResponseDto> {
    const user = await this.findUserPlanOrThrow(userId);

    if (user.role !== 'admin' && resolveEffectivePlan(user) !== 'premium') {
      throw new ForbiddenException(
        'Plano premium necessário para acessar este recurso.',
      );
    }

    const vehicles = await this.prisma.vehicle.findMany({
      where: { userId },
      select: {
        status: true,
        purchasePrice: true,
        soldPrice: true,
        evaluation: {
          select: {
            evaluationExpenses: {
              select: {
                amount: true,
              },
            },
          },
        },
      },
    });

    let totalPurchasedVehicles = 0;
    let totalSoldVehicles = 0;
    let totalInvested = 0;
    let totalExpenses = 0;
    let totalSold = 0;
    let totalProfit = 0;
    const soldProfitMargins: number[] = [];

    for (const vehicle of vehicles) {
      const purchasePrice = this.toNumber(vehicle.purchasePrice);
      const soldPrice = this.toNumber(vehicle.soldPrice);
      const vehicleExpenses = vehicle.evaluation
        ? vehicle.evaluation.evaluationExpenses.reduce(
            (sum, expense) => sum + this.toNumber(expense.amount),
            0,
          )
        : 0;
      const vehicleInvestment = purchasePrice + vehicleExpenses;
      const isPurchased =
        vehicle.purchasePrice !== null ||
        vehicle.status === VehicleStatus.PURCHASED ||
        vehicle.status === VehicleStatus.SOLD;
      const isSold =
        vehicle.soldPrice !== null || vehicle.status === VehicleStatus.SOLD;

      if (isPurchased) {
        totalPurchasedVehicles += 1;
      }

      if (isSold) {
        totalSoldVehicles += 1;
        totalSold += soldPrice;
        const vehicleProfit = soldPrice - vehicleInvestment;
        totalProfit += vehicleProfit;

        if (vehicleInvestment > 0) {
          soldProfitMargins.push((vehicleProfit / vehicleInvestment) * 100);
        }
      }

      totalExpenses += vehicleExpenses;
      totalInvested += vehicleInvestment;
    }

    return {
      totalPurchasedVehicles,
      totalSoldVehicles,
      totalInvested: this.roundMoney(totalInvested),
      totalExpenses: this.roundMoney(totalExpenses),
      totalSold: this.roundMoney(totalSold),
      totalProfit: this.roundMoney(totalProfit),
      averageProfitMargin:
        soldProfitMargins.length === 0
          ? null
          : Number(
              (
                soldProfitMargins.reduce((sum, margin) => sum + margin, 0) /
                soldProfitMargins.length
              ).toFixed(2),
            ),
    };
  }

  private async findUserPlanOrThrow(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        plan: true,
        planStatus: true,
        planExpiresAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return user;
  }

  private toNumber(value: Prisma.Decimal | number | string | null | undefined) {
    return value === null || value === undefined ? 0 : Number(value);
  }

  private roundMoney(value: number): number {
    return Number(value.toFixed(2));
  }
}
