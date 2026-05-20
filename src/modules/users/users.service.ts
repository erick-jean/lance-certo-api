import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { HashService } from 'src/common/hash/hash.service';
import {
  isRecordNotFoundError,
  isUniqueConstraintError,
} from 'src/common/errors/prisma-error.util';
import { PrismaService } from 'src/database/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { ChangeMyPasswordDto } from './dto/change-my-password.dto';
import { ResponseUserDto } from './dto/response-user.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { userResponseSelect, UserResponseRecord } from './user.select';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hashService: HashService,
  ) {}

  async findMe(userId: string): Promise<ResponseUserDto> {
    const user = await this.findUserOrThrow(userId);

    return this.toResponse(user);
  }

  async updateMe(userId: string, dto: UpdateMeDto): Promise<ResponseUserDto> {
    if (dto.email !== undefined) {
      await this.ensureEmailIsAvailable(dto.email, userId);
    }

    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: this.toUpdateMeData(dto),
        select: userResponseSelect,
      });

      return this.toResponse(updatedUser);
    } catch (error) {
      if (isRecordNotFoundError(error)) {
        throw new NotFoundException('Usuário não encontrado');
      }

      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Email já cadastrado');
      }

      throw error;
    }
  }

  async changeMyPassword(
    userId: string,
    dto: ChangeMyPasswordDto,
  ): Promise<void> {
    if (dto.confirmPassword && dto.confirmPassword !== dto.newPassword) {
      throw new BadRequestException('Confirmação de senha não confere');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const currentPasswordMatches = await this.hashService.compare(
      dto.currentPassword,
      user.password,
    );

    if (!currentPasswordMatches) {
      throw new BadRequestException('Senha atual inválida');
    }

    const isSamePassword = await this.hashService.compare(
      dto.newPassword,
      user.password,
    );

    if (isSamePassword) {
      throw new BadRequestException('A nova senha deve ser diferente da atual');
    }

    const password = await this.hashService.hash(dto.newPassword);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { password },
      }),
      this.prisma.refreshToken.updateMany({
        where: {
          userId: user.id,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      }),
    ]);
  }

  async findAll(): Promise<ResponseUserDto[]> {
    const users = await this.prisma.user.findMany({
      select: userResponseSelect,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users.map((user) => this.toResponse(user));
  }

  async findById(userId: string): Promise<ResponseUserDto> {
    const user = await this.findUserOrThrow(userId);

    return this.toResponse(user);
  }

  async updateById(
    userId: string,
    dto: UpdateUserDto,
  ): Promise<ResponseUserDto> {
    if (dto.email !== undefined) {
      await this.ensureEmailIsAvailable(dto.email, userId);
    }

    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: this.toUpdateUserData(dto),
        select: userResponseSelect,
      });

      return this.toResponse(updatedUser);
    } catch (error) {
      if (isRecordNotFoundError(error)) {
        throw new NotFoundException('Usuário não encontrado');
      }

      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Email já cadastrado');
      }

      throw error;
    }
  }

  async updateStatus(
    requesterUserId: string,
    userId: string,
    dto: UpdateUserStatusDto,
  ): Promise<ResponseUserDto> {
    if (requesterUserId === userId && dto.isActive === false) {
      throw new ForbiddenException('Admin não pode inativar a própria conta');
    }

    const updatedUser = await this.updateById(userId, {
      isActive: dto.isActive,
    });

    if (!dto.isActive) {
      await this.revokeUserRefreshTokens(userId);
    }

    return updatedUser;
  }

  async removeById(requesterUserId: string, userId: string): Promise<void> {
    if (requesterUserId === userId) {
      throw new ForbiddenException('Admin não pode remover a própria conta');
    }

    await this.findUserOrThrow(userId);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { isActive: false },
      }),
      this.prisma.refreshToken.updateMany({
        where: {
          userId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      }),
    ]);
  }

  private async findUserOrThrow(userId: string): Promise<UserResponseRecord> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: userResponseSelect,
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  private async ensureEmailIsAvailable(
    email: string,
    ignoredUserId?: string,
  ): Promise<void> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: this.normalizeEmail(email) },
      select: { id: true },
    });

    if (existingUser && existingUser.id !== ignoredUserId) {
      throw new ConflictException('Email já cadastrado');
    }
  }

  private async revokeUserRefreshTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  private toUpdateMeData(dto: UpdateMeDto): Prisma.UserUpdateInput {
    return {
      name: dto.name,
      email: dto.email,
    };
  }

  private toUpdateUserData(dto: UpdateUserDto): Prisma.UserUpdateInput {
    return {
      name: dto.name,
      email: dto.email,
      role: dto.role,
      isActive: dto.isActive,
    };
  }

  private toResponse(user: UserResponseRecord): ResponseUserDto {
    return new ResponseUserDto(user);
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}
