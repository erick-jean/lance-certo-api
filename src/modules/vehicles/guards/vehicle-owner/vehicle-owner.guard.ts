import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { UserRole } from 'src/common/enums/user-role.enum';
import { PrismaService } from 'src/database/prisma.service';
import { AuthenticatedRequest } from '../../../auth/interfaces/authenticated-request.interface';

type VehicleOwnerRequest = AuthenticatedRequest & {
  params: {
    vehicleId?: string;
  };
};

@Injectable()
export class VehicleOwnerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<VehicleOwnerRequest>();

    if (!request.user?.sub) {
      throw new UnauthorizedException();
    }

    const userId = request.user.sub;
    const userRole = request.user.role;
    const vehicleId = request.params.vehicleId;

    if (!vehicleId) {
      throw new BadRequestException('ID do veículo é obrigatório.');
    }

    /**
     * Vehicle ownership is loaded from the database instead of trusting route
     * parameters or request body data.
     */
    const vehicle = await this.prisma.vehicle.findUnique({
      where: {
        id: vehicleId,
      },
      select: {
        userId: true,
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Veículo não encontrado.');
    }

    const isOwner = vehicle.userId === userId;
    const isAdmin = userRole === UserRole.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar este veículo.',
      );
    }

    return true;
  }
}
