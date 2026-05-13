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

const PASSWORD_RESET_TOKEN_TTL_MINUTES = 15;
const DEFAULT_REFRESH_TOKEN_EXPIRES_DAYS = 7;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly hashService: HashService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Creates a new user account after checking for email uniqueness.
   *
   * The password is always stored as a bcrypt hash, and the returned payload
   * intentionally excludes sensitive fields such as `password`.
   */
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
          plan: 'free',
          planStatus: 'inactive',
        },
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

      return new ResponseUserDto(user);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Este e-mail já está em uso.');
      }

      throw error;
    }
  }

  /**
   * Authenticates a user and issues a short-lived access token plus a
   * long-lived refresh token.
   *
   * The refresh token is returned to the controller so it can be stored in an
   * HttpOnly cookie. Only the hashed version is persisted in the database.
   */
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

  /**
   * Starts the password reset flow for an email address.
   *
   * The response is intentionally generic to avoid exposing whether an email
   * exists in the system. The raw token is only used to build the reset link;
   * the database stores a SHA-256 hash of that token.
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<MessageResponseDto> {
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

    this.sendPasswordResetLink(user.email, token);

    return response;
  }

  /**
   * Resets a user's password when a valid, unused and non-expired reset token
   * is provided.
   *
   * Marking the token as used and updating the password happen in the same
   * transaction so a token cannot be reused during concurrent requests.
   */
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

  /**
   * Returns the currently authenticated user profile.
   *
   * The user id comes from the JWT `sub` claim, and the query excludes the
   * password hash from the response.
   */
  async me(userId: string): Promise<ResponseUserDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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

    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    return new ResponseUserDto(user);
  }

  /**
   * Rotates a refresh token and returns a new token pair.
   *
   * The old refresh token is revoked inside a transaction before a new one is
   * created. This limits replay risk if a refresh token is intercepted.
   */
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

  /**
   * Revokes the active refresh token for the current session.
   *
   * A missing, expired or already revoked token is treated as an unauthorized
   * request, which prevents logout from succeeding for unauthenticated clients.
   */
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

  /**
   * Creates an access token and a persisted refresh token for a JWT payload.
   *
   * Accepts either the regular Prisma service or a transaction client so token
   * rotation can create the new refresh token atomically.
   */
  private async issueAuthTokens(
    payload: JwtPayload,
    prisma: PrismaService | Prisma.TransactionClient = this.prisma,
  ): Promise<AuthTokens> {
    const refreshToken = randomBytes(64).toString('hex');
    const refreshTokenHash = this.hashToken(refreshToken);
    const refreshTokenExpiresDays = this.getRefreshTokenExpiresDays();

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

  /**
   * Reads and validates the refresh token lifetime from environment settings.
   */
  private getRefreshTokenExpiresDays(): number {
    const value = Number(this.configService.get('JWT_REFRESH_EXPIRES_DAYS'));

    if (!Number.isFinite(value) || value <= 0) {
      return DEFAULT_REFRESH_TOKEN_EXPIRES_DAYS;
    }

    return value;
  }

  /**
   * Builds the frontend password reset URL using the configured app URL.
   */
  private buildPasswordResetLink(token: string): string {
    const frontendUrl =
      this.configService.get<string>('APP_FRONTEND_URL') ??
      'http://localhost:4200';

    return `${frontendUrl.replace(/\/$/, '')}/reset-password?token=${token}`;
  }

  private sendPasswordResetLink(email: string, token: string): void {
    const resetLink = this.buildPasswordResetLink(token);

    // TODO: Replace this with EmailService once SMTP/API delivery is configured.
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Password reset link for ${email}: ${resetLink}`);
    }
  }

  /**
   * Returns the generic password reset response used for both existing and
   * non-existing emails.
   */
  private getPasswordResetRequestedResponse(): MessageResponseDto {
    return {
      message: 'Se o e-mail existir, enviaremos um link de recuperação.',
    };
  }
}
