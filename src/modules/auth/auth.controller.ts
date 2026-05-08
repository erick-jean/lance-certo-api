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
import { AuthGuard } from './auth.guard';
import { AuthenticatedRequest } from './interfaces/authenticated-request.interface';
import { UserResponseDto } from '../users/dto/user-response.dto';

@ApiTags('Auth')
@ApiBadRequestResponse({ description: 'Invalid request payload' })
@ApiTooManyRequestsResponse({ description: 'Too many requests' })
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Registers a new user and returns the public user representation.
   */
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000, blockDuration: 300_000 } })
  @ApiOperation({ summary: 'Registra um novo usuario' })
  @ApiCreatedResponse({ type: UserResponseDto })
  @ApiConflictResponse({ description: 'Email already registered' })
  register(@Body() registerDto: RegisterUserDto): Promise<UserResponseDto> {
    return this.authService.register(registerDto);
  }

  /**
   * Authenticates a user and stores the refresh token in an HttpOnly cookie.
   *
   * The JSON response only exposes the access token so browser JavaScript does
   * not need to handle the refresh token directly.
   */
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60_000, blockDuration: 300_000 } })
  @ApiOperation({
    summary: 'Autentica um usuario e grava refresh token em cookie HttpOnly',
  })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
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

  /**
   * Rotates the refresh token from the HttpOnly cookie and returns a new access
   * token.
   */
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  @Throttle({ default: { limit: 30, ttl: 60_000, blockDuration: 60_000 } })
  @ApiOperation({
    summary: 'Gera novo access token usando refresh token em cookie HttpOnly',
  })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing refresh token' })
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

  /**
   * Starts the password recovery flow for the submitted email.
   */
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 300_000, blockDuration: 900_000 } })
  @ApiOperation({ summary: 'Solicita recuperacao de senha' })
  @ApiOkResponse({ type: MessageResponseDto })
  forgotPassword(@Body() dto: ForgotPasswordDto): Promise<MessageResponseDto> {
    return this.authService.forgotPassword(dto);
  }

  /**
   * Completes password recovery by validating the reset token and saving the
   * new password hash.
   */
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 300_000, blockDuration: 900_000 } })
  @ApiOperation({ summary: 'Redefine a senha usando token de recuperacao' })
  @ApiOkResponse({ type: MessageResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid or expired reset token' })
  resetPassword(@Body() dto: ResetPasswordDto): Promise<MessageResponseDto> {
    return this.authService.resetPassword(dto);
  }

  /**
   * Returns the profile associated with the bearer access token.
   */
  @Get('me')
  @Throttle({ default: { limit: 60, ttl: 60_000, blockDuration: 60_000 } })
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retorna o usuario autenticado' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  me(@Req() req: AuthenticatedRequest): Promise<UserResponseDto> {
    return this.authService.me(req.user.sub);
  }

  /**
   * Revokes the refresh token stored in the HttpOnly cookie and clears it from
   * the browser.
   */
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  @Throttle({ default: { limit: 10, ttl: 60_000, blockDuration: 60_000 } })
  @ApiOperation({
    summary: 'Revoga refresh token em cookie HttpOnly e encerra sessao',
  })
  @ApiOkResponse({ type: MessageResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing refresh token' })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<MessageResponseDto> {
    const refreshToken = this.getRefreshTokenFromCookie(request);
    const result = await this.authService.logout(refreshToken);

    this.clearRefreshTokenCookie(response);

    return result;
  }

  /**
   * Reads the refresh token cookie or rejects the request when it is missing.
   */
  private getRefreshTokenFromCookie(request: Request): string {
    const refreshToken = this.getOptionalRefreshTokenFromCookie(request);

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    return refreshToken;
  }

  /**
   * Parses the raw Cookie header and returns the configured refresh token
   * cookie value when present.
   */
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

  /**
   * Writes the refresh token using secure cookie options.
   */
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

  /**
   * Clears the refresh token cookie using the same path/security settings used
   * when it was created.
   */
  private clearRefreshTokenCookie(response: Response): void {
    response.clearCookie(
      this.getRefreshTokenCookieName(),
      this.getRefreshTokenCookieOptions(),
    );
  }

  /**
   * Returns the configured refresh token cookie name.
   */
  private getRefreshTokenCookieName(): string {
    return (
      this.configService.get<string>('REFRESH_TOKEN_COOKIE_NAME') ??
      'refresh_token'
    );
  }

  /**
   * Builds the cookie options used for refresh token storage.
   */
  private getRefreshTokenCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.isRefreshTokenCookieSecure(),
      sameSite: 'strict',
      path: '/auth',
      maxAge: this.getRefreshTokenCookieMaxAge(),
    };
  }

  /**
   * Enables the Secure cookie flag when the environment requires HTTPS.
   */
  private isRefreshTokenCookieSecure(): boolean {
    return (
      this.configService.get<string>('REFRESH_TOKEN_COOKIE_SECURE') === 'true'
    );
  }

  /**
   * Converts refresh token expiration from days to cookie `maxAge`
   * milliseconds.
   */
  private getRefreshTokenCookieMaxAge(): number {
    const expiresDays = Number(
      this.configService.get('JWT_REFRESH_EXPIRES_DAYS'),
    );
    const safeExpiresDays =
      Number.isFinite(expiresDays) && expiresDays > 0 ? expiresDays : 7;

    return safeExpiresDays * 24 * 60 * 60 * 1000;
  }
}
