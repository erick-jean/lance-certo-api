import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from 'src/common/enums/user-role.enum';
import {
  SubscriptionPlan,
  SubscriptionPlanStatus,
} from '../../../generated/prisma/enums';
import { PlanGuard } from './plan.guard';

describe('PlanGuard', () => {
  it('bloqueia usuário sem plano premium ativo em rota premium', async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(SubscriptionPlan.PREMIUM),
    } as unknown as Reflector;
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-1',
          plan: SubscriptionPlan.FREE,
          planStatus: SubscriptionPlanStatus.NONE,
          planExpiresAt: null,
        }),
      },
    };
    const guard = new PlanGuard(reflector, prisma as never);
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            sub: 'user-1',
            role: UserRole.USER,
          },
        }),
      }),
    };

    await expect(guard.canActivate(context as never)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
