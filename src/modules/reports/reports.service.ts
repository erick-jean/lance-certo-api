import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ownerScope } from 'src/common/access/owner-scope.util';
import { UserRole } from 'src/common/enums/user-role.enum';
import { calculateVehicleFinancialSummary } from 'src/common/finance/vehicle-finance.util';
import { resolveEffectivePlan } from 'src/common/plans/plan-limits';
import { PrismaService } from 'src/database/prisma.service';
import { ResponseEvaluationChecklistItemDto } from '../evaluations/dto/response-evaluation-checklist-item.dto';
import { ResponseEvaluationExpenseDto } from '../evaluations/dto/response-evaluation-expense.dto';
import { ResponseVehicleEvaluationDto } from '../evaluations/dto/response-vehicle-evaluation.dto';
import { ResponseVehicleDto } from '../vehicles/dto/response-vehicle.dto';
import { VehicleImageResponseDto } from '../vehicles/images/dto/response-vehicle-image.dto';
import { VehicleReportResponseDto } from './dto/vehicle-report-response.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getVehicleReport(
    userId: string,
    vehicleId: string,
    userRole?: UserRole,
  ): Promise<VehicleReportResponseDto> {
    await this.ensurePremiumAccess(userId, userRole);

    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        ...ownerScope(userId, userRole),
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
      throw new NotFoundException('Veículo não encontrado.');
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
      financialSummary: calculateVehicleFinancialSummary(vehicle),
      generatedAt: new Date(),
    };
  }

  private async ensurePremiumAccess(
    userId: string,
    userRole?: UserRole,
  ): Promise<void> {
    if (userRole === UserRole.ADMIN) {
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
}
