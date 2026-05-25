import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { CookieOptions, Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ResponseUserDto } from '../users/dto/response-user.dto';

@ApiTags('Auth')
@ApiBadRequestResponse({ description: 'Dados da requisição inválidos.' })
@ApiTooManyRequestsResponse({ description: 'Muitas requisições.' })
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000, blockDuration: 300_000 } })
  @ApiOperation({ summary: 'Registra um novo usuário.' })
  @ApiCreatedResponse({ type: ResponseUserDto })
  @ApiConflictResponse({ description: 'E-mail já cadastrado.' })
  register(@Body() registerDto: RegisterUserDto): Promise<ResponseUserDto> {
    return this.authService.register(registerDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60_000, blockDuration: 300_000 } })
  @ApiOperation({
    summary: 'Autentica um usuário e grava refresh token em cookie HttpOnly.',
  })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Credenciais inválidas.' })
  async signIn(
    @Body() signInDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const tokens = await this.authService.signIn(signInDto);

    this.setRefreshTokenCookie(response, tokens.refresh_token);

    return {
      access_token: tokens.access_token,
    };
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  @Throttle({ default: { limit: 20, ttl: 60_000, blockDuration: 120_000 } })
  @ApiOperation({
    summary: 'Gera novo access token usando refresh token em cookie HttpOnly.',
  })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Refresh token inválido ou ausente.',
  })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const refreshToken = this.getRefreshTokenFromCookie(request);
    const tokens = await this.authService.refresh(refreshToken);

    this.setRefreshTokenCookie(response, tokens.refresh_token);

    return {
      access_token: tokens.access_token,
    };
  }

  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 300_000, blockDuration: 900_000 } })
  @ApiOperation({ summary: 'Solicita recuperação de senha.' })
  @ApiOkResponse({ type: MessageResponseDto })
  forgotPassword(@Body() dto: ForgotPasswordDto): Promise<MessageResponseDto> {
    return this.authService.forgotPassword(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 300_000, blockDuration: 900_000 } })
  @ApiOperation({ summary: 'Redefine a senha usando token de recuperação.' })
  @ApiOkResponse({ type: MessageResponseDto })
  @ApiBadRequestResponse({
    description: 'Token de recuperação inválido ou expirado.',
  })
  resetPassword(@Body() dto: ResetPasswordDto): Promise<MessageResponseDto> {
    return this.authService.resetPassword(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  @Throttle({ default: { limit: 10, ttl: 60_000, blockDuration: 60_000 } })
  @ApiOperation({
    summary: 'Revoga refresh token em cookie HttpOnly e encerra sessão.',
  })
  @ApiOkResponse({ type: MessageResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Refresh token inválido ou ausente.',
  })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<MessageResponseDto> {
    const refreshToken = this.getRefreshTokenFromCookie(request);
    const logoutResult = await this.authService.logout(refreshToken);

    this.clearRefreshTokenCookie(response);

    return logoutResult;
  }

  private getRefreshTokenFromCookie(request: Request): string {
    const refreshToken = this.getOptionalRefreshTokenFromCookie(request);

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token não encontrado.');
    }

    return refreshToken;
  }

  private getOptionalRefreshTokenFromCookie(
    request: Request,
  ): string | undefined {
    const cookieName = this.getRefreshTokenCookieName();
    const cookies = request.headers.cookie?.split(';') ?? [];
    const cookie = cookies.find((item) =>
      item.trim().startsWith(`${cookieName}=`),
    );

    if (!cookie) {
      return undefined;
    }

    const [, value] = cookie.split('=');
    return value ? decodeURIComponent(value) : undefined;
  }

  private setRefreshTokenCookie(
    response: Response,
    refreshToken: string,
  ): void {
    response.cookie(
      this.getRefreshTokenCookieName(),
      refreshToken,
      this.getRefreshTokenCookieOptions(),
    );
  }

  private clearRefreshTokenCookie(response: Response): void {
    response.clearCookie(
      this.getRefreshTokenCookieName(),
      this.getRefreshTokenCookieOptions(),
    );
  }

  private getRefreshTokenCookieName(): string {
    return this.configService.getOrThrow<string>('REFRESH_TOKEN_COOKIE_NAME');
  }

  private getRefreshTokenCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.isRefreshTokenCookieSecure(),
      sameSite: 'strict',
      path: '/auth',
      maxAge: this.getRefreshTokenCookieMaxAge(),
    };
  }

  private isRefreshTokenCookieSecure(): boolean {
    return this.configService.getOrThrow<boolean>(
      'REFRESH_TOKEN_COOKIE_SECURE',
    );
  }

  private getRefreshTokenCookieMaxAge(): number {
    const expiresDays = this.configService.getOrThrow<number>(
      'JWT_REFRESH_EXPIRES_DAYS',
    );

    return expiresDays * 24 * 60 * 60 * 1000;
  }
}
