import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import { HashService } from 'src/common/hash/hash.service';
import { PrismaService } from 'src/database/prisma.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { UserResponseDto } from '../users/dto/user-response.dto';

const PASSWORD_RESET_TOKEN_TTL_MINUTES = 15;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly hashService: HashService,
    private readonly configService: ConfigService,
  ) {}

  async register(data: RegisterUserDto): Promise<UserResponseDto> {
    const userExists = await this.prisma.user.findUnique({
      where: { email: data.email },
      select: { id: true },
    });

    if (userExists) {
      throw new ConflictException('Email already registered');
    }

    const password = await this.hashService.hash(data.password);
    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
      },
    });

    return user;
  }

  async signIn(login: LoginDto): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: login.email },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await this.hashService.compare(
      login.password,
      user.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLogin: new Date(),
      },
    });

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<MessageResponseDto> {
    const response = this.getPasswordResetRequestedResponse();
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true, email: true },
    });

    if (!user) {
      return response;
    }

    await this.prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });

    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashPasswordResetToken(token);
    const expiresAt = new Date(
      Date.now() + PASSWORD_RESET_TOKEN_TTL_MINUTES * 60 * 1000,
    );

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: tokenHash,
        expiresAt,
      },
    });

    const resetLink = this.buildPasswordResetLink(token);

    // TODO: substituir por um EmailService quando o envio SMTP/API estiver configurado.
    console.log(`Password reset link for ${user.email}: ${resetLink}`);

    return response;
  }

  async resetPassword(dto: ResetPasswordDto): Promise<MessageResponseDto> {
    const tokenHash = this.hashPasswordResetToken(dto.token);
    const now = new Date();

    const resetToken = await this.prisma.passwordResetToken.findFirst({
      where: {
        token: tokenHash,
        usedAt: null,
        expiresAt: {
          gt: now,
        },
      },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!resetToken) {
      throw new BadRequestException('Token invalido ou expirado');
    }

    const password = await this.hashService.hash(dto.password);

    await this.prisma.$transaction(async (tx) => {
      const updatedTokens = await tx.passwordResetToken.updateMany({
        where: {
          id: resetToken.id,
          usedAt: null,
          expiresAt: {
            gt: now,
          },
        },
        data: {
          usedAt: now,
        },
      });

      if (updatedTokens.count !== 1) {
        throw new BadRequestException('Token invalido ou expirado');
      }

      await tx.user.update({
        where: { id: resetToken.userId },
        data: { password },
      });
    });

    return {
      message: 'Senha redefinida com sucesso.',
    };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    return user;
  }

  private hashPasswordResetToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private buildPasswordResetLink(token: string): string {
    const frontendUrl =
      this.configService.get<string>('APP_FRONTEND_URL') ??
      'http://localhost:4200';

    return `${frontendUrl.replace(/\/$/, '')}/reset-password?token=${token}`;
  }

  private getPasswordResetRequestedResponse(): MessageResponseDto {
    return {
      message: 'Se o email existir, enviaremos um link de recuperacao.',
    };
  }
}
