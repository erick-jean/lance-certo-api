import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  REQUIRED_PLAN_KEY,
  RequiredPlan,
} from 'src/common/decorators/require-plan.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { isPremiumActive } from 'src/common/plans/plan-limits';
import { PrismaService } from 'src/database/prisma.service';
import { AuthenticatedRequest } from 'src/modules/auth/interfaces/authenticated-request.interface';

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPlan = this.reflector.getAllAndOverride<RequiredPlan>(
      REQUIRED_PLAN_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPlan) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (request.user.role === UserRole.ADMIN) {
      return true;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: request.user.sub },
      select: {
        id: true,
        plan: true,
        planStatus: true,
        planExpiresAt: true,
      },
    });

    if (!user) {
      throw new ForbiddenException('Usuário não encontrado.');
    }

    if (requiredPlan === 'premium' && !isPremiumActive(user)) {
      throw new ForbiddenException(
        'Plano premium necessário para acessar este recurso.',
      );
    }

    return true;
  }
}
