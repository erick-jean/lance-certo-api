import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { CookieOptions, Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthGuard } from './auth.guard';
import { AuthenticatedRequest } from './interfaces/authenticated-request.interface';
import { UserResponseDto } from '../users/dto/user-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Registra um novo usuario' })
  @ApiCreatedResponse({ type: UserResponseDto })
  register(@Body() registerDto: RegisterUserDto): Promise<UserResponseDto> {
    return this.authService.register(registerDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({
    summary: 'Autentica um usuario e grava refresh token em cookie HttpOnly',
  })
  @ApiOkResponse({ type: AuthResponseDto })
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
  @ApiOperation({
    summary: 'Gera novo access token usando refresh token em cookie HttpOnly',
  })
  @ApiOkResponse({ type: AuthResponseDto })
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
  @ApiOperation({ summary: 'Solicita recuperacao de senha' })
  @ApiOkResponse({ type: MessageResponseDto })
  forgotPassword(@Body() dto: ForgotPasswordDto): Promise<MessageResponseDto> {
    return this.authService.forgotPassword(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  @ApiOperation({ summary: 'Redefine a senha usando token de recuperacao' })
  @ApiOkResponse({ type: MessageResponseDto })
  resetPassword(@Body() dto: ResetPasswordDto): Promise<MessageResponseDto> {
    return this.authService.resetPassword(dto);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retorna o usuario autenticado' })
  @ApiOkResponse({ type: UserResponseDto })
  me(@Req() req: AuthenticatedRequest): Promise<UserResponseDto> {
    return this.authService.me(req.user.sub);
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  @ApiOperation({
    summary: 'Revoga refresh token em cookie HttpOnly e encerra sessao',
  })
  @ApiOkResponse({ type: MessageResponseDto })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<MessageResponseDto> {
    const refreshToken = this.getRefreshTokenFromCookie(request);
    const result = await this.authService.logout(refreshToken);

    this.clearRefreshTokenCookie(response);

    return result;
  }

  private getRefreshTokenFromCookie(request: Request): string {
    const refreshToken = this.getOptionalRefreshTokenFromCookie(request);

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
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
    return (
      this.configService.get<string>('REFRESH_TOKEN_COOKIE_NAME') ??
      'refresh_token'
    );
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
    return (
      this.configService.get<string>('REFRESH_TOKEN_COOKIE_SECURE') === 'true'
    );
  }

  private getRefreshTokenCookieMaxAge(): number {
    const expiresDays = Number(
      this.configService.get('JWT_REFRESH_EXPIRES_DAYS'),
    );
    const safeExpiresDays =
      Number.isFinite(expiresDays) && expiresDays > 0 ? expiresDays : 7;

    return safeExpiresDays * 24 * 60 * 60 * 1000;
  }
}
