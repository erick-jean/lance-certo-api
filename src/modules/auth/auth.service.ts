import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import { isUniqueConstraintError } from 'src/common/errors/prisma-error.util';
import { HashService } from 'src/common/hash/hash.service';
import { PrismaService } from 'src/database/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthTokens } from './interfaces/auth-tokens.interface';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { ResponseUserDto } from '../users/dto/response-user.dto';
import { userResponseSelect } from '../users/user.select';
import { EmailService } from '../email/email.service';

const PASSWORD_RESET_TOKEN_TTL_MINUTES = 15;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly hashService: HashService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async register(registerDto: RegisterUserDto): Promise<ResponseUserDto> {
    const email = this.normalizeEmail(registerDto.email);
    const userExists = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (userExists) {
      throw new ConflictException('Este e-mail já está em uso.');
    }

    try {
      const password = await this.hashService.hash(registerDto.password);
      const user = await this.prisma.user.create({
        data: {
          name: registerDto.name,
          email,
          password,
          role: 'user',
          plan: 'FREE',
          planStatus: 'NONE',
        },
        select: userResponseSelect,
      });

      return new ResponseUserDto(user);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Este e-mail já está em uso.');
      }

      throw error;
    }
  }

  async signIn(login: LoginDto): Promise<AuthTokens> {
    const email = this.normalizeEmail(login.email);
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const passwordMatches = await this.hashService.compare(
      login.password,
      user.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Credenciais inválidas');
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

    return this.issueAuthTokens(payload);
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<MessageResponseDto> {
    // Keep the response generic so callers cannot discover registered emails.
    const response = this.getPasswordResetRequestedResponse();
    const email = this.normalizeEmail(dto.email);
    const user = await this.prisma.user.findUnique({
      where: { email },
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

    await this.emailService.sendPasswordResetEmail(
      user.email,
      this.buildPasswordResetLink(token),
    );

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

    // Consume the reset token atomically to prevent reuse.
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

      await tx.refreshToken.updateMany({
        where: {
          userId: resetToken.userId,
          revokedAt: null,
        },
        data: {
          revokedAt: now,
        },
      });
    });

    return {
      message: 'Senha redefinida com sucesso.',
    };
  }

  async me(userId: string): Promise<ResponseUserDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: userResponseSelect,
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    return new ResponseUserDto(user);
  }

  async refresh(rawRefreshToken: string): Promise<AuthTokens> {
    const tokenHash = this.hashToken(rawRefreshToken);
    const now = new Date();

    const storedRefreshToken = await this.prisma.refreshToken.findFirst({
      where: {
        token: tokenHash,
        revokedAt: null,
        expiresAt: {
          gt: now,
        },
      },
      select: {
        id: true,
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    if (!storedRefreshToken || !storedRefreshToken.user.isActive) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    const payload: JwtPayload = {
      sub: storedRefreshToken.user.id,
      email: storedRefreshToken.user.email,
      role: storedRefreshToken.user.role,
    };

    // Revoke the old refresh token before issuing the next pair.
    return this.prisma.$transaction(async (tx) => {
      const revokedTokens = await tx.refreshToken.updateMany({
        where: {
          id: storedRefreshToken.id,
          revokedAt: null,
          expiresAt: {
            gt: now,
          },
        },
        data: {
          revokedAt: now,
        },
      });

      if (revokedTokens.count !== 1) {
        throw new UnauthorizedException('Refresh token inválido');
      }

      return this.issueAuthTokens(payload, tx);
    });
  }

  async logout(refreshToken: string): Promise<MessageResponseDto> {
    const tokenHash = this.hashToken(refreshToken);

    const revokedTokens = await this.prisma.refreshToken.updateMany({
      where: {
        token: tokenHash,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      data: {
        revokedAt: new Date(),
      },
    });

    if (revokedTokens.count !== 1) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    return {
      message: 'Logout realizado com sucesso.',
    };
  }

  private hashPasswordResetToken(token: string): string {
    return this.hashToken(token);
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  /**
   * Produces a deterministic SHA-256 token hash.
   *
   * Deterministic hashing lets the API find opaque tokens by unique index
   * while avoiding storage of raw bearer secrets.
   */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async issueAuthTokens(
    payload: JwtPayload,
    prisma: PrismaService | Prisma.TransactionClient = this.prisma,
  ): Promise<AuthTokens> {
    const refreshToken = randomBytes(64).toString('hex');
    const refreshTokenHash = this.hashToken(refreshToken);
    const refreshTokenExpiresDays = this.getRefreshTokenExpiresDays();

    // Store only the hash; the raw refresh token is returned for the HttpOnly cookie.
    await prisma.refreshToken.create({
      data: {
        userId: payload.sub,
        token: refreshTokenHash,
        expiresAt: new Date(
          Date.now() + refreshTokenExpiresDays * 24 * 60 * 60 * 1000,
        ),
      },
    });

    return {
      access_token: await this.jwtService.signAsync(payload),
      refresh_token: refreshToken,
    };
  }

  private getRefreshTokenExpiresDays(): number {
    return this.configService.getOrThrow<number>(
      'JWT_REFRESH_EXPIRES_DAYS',
    );
  }

  private buildPasswordResetLink(token: string): string {
    const frontendUrl = this.configService.getOrThrow<string>(
      'APP_FRONTEND_URL',
    );

    return `${frontendUrl.replace(/\/$/, '')}/reset-password?token=${token}`;
  }

  private getPasswordResetRequestedResponse(): MessageResponseDto {
    return {
      message: 'Se o e-mail existir, enviaremos um link de recuperação.',
    };
  }
}
