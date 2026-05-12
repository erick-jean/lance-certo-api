import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

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

    const userId = request.user.sub;
    const userRole = request.user.role;
    const vehicleId = request.params.vehicleId;

    if (!vehicleId) {
      throw new BadRequestException('Vehicle id is required.');
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
      throw new NotFoundException('Vehicle not found.');
    }

    const isOwner = vehicle.userId === userId;
    const isAdmin = userRole === 'admin';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'You do not have permission to access this vehicle.',
      );
    }

    return true;
  }
}
