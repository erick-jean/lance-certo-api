import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findUserProfileByEmail(
    email: string,
    requester: JwtPayload,
  ): Promise<UserResponseDto> {
    const normalizedEmail = email.trim().toLowerCase();

    /**
     * Non-admin users may only fetch their own profile.
     */
    if (
      requester.role !== 'admin' &&
      requester.email.trim().toLowerCase() !== normalizedEmail
    ) {
      throw new ForbiddenException('Cannot access another user profile');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        plan: true,
        planStatus: true,
        planExpiresAt: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    return user;
  }
}
