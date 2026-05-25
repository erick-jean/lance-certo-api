import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from 'src/common/enums/user-role.enum';
import {
  SubscriptionPlan,
  SubscriptionPlanStatus,
  VehicleStatus,
  VehicleType,
} from '../../../generated/prisma/enums';
import { VehiclesService } from './vehicles.service';

describe('VehiclesService', () => {
  const makeService = () => {
    const prisma = {
      user: {
        findUnique: jest.fn(),
      },
      vehicle: {
        count: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    const vehicleImagesService = {
      removeFiles: jest.fn(),
    };
    const service = new VehiclesService(
      prisma as never,
      vehicleImagesService as never,
    );

    return { service, prisma };
  };

  it('bloqueia usuário que tenta acessar veículo de outro usuário', async () => {
    const { service, prisma } = makeService();
    prisma.vehicle.findFirst.mockResolvedValue(null);

    await expect(
      service.findVehicleForUser('user-1', 'vehicle-from-other-user'),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.vehicle.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'vehicle-from-other-user',
        userId: 'user-1',
      },
    });
  });

  it('bloqueia plano grátis ao ultrapassar limite de veículos', async () => {
    const { service, prisma } = makeService();
    const tx = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          plan: SubscriptionPlan.FREE,
          planStatus: SubscriptionPlanStatus.NONE,
          planExpiresAt: null,
          role: UserRole.USER,
        }),
      },
      vehicle: {
        count: jest.fn().mockResolvedValue(3),
        create: jest.fn(),
      },
    };

    prisma.$transaction.mockImplementation(
      (callback: (transaction: typeof tx) => unknown) => callback(tx),
    );

    await expect(
      service.createVehicleForUser('user-1', {
        type: VehicleType.CAR,
        status: VehicleStatus.ANALYZING,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(tx.vehicle.create).not.toHaveBeenCalled();
  });

  it('bloqueia recurso premium para usuário sem plano ativo', async () => {
    const { service, prisma } = makeService();
    prisma.user.findUnique.mockResolvedValue({
      plan: SubscriptionPlan.FREE,
      planStatus: SubscriptionPlanStatus.NONE,
      planExpiresAt: null,
    });

    await expect(
      service.getVehicleFinancialSummary('user-1', 'vehicle-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.vehicle.findFirst).not.toHaveBeenCalled();
  });
});
