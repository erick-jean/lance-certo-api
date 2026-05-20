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
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { CookieOptions, Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthGuard } from './auth.guard';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { ResponseUserDto } from '../users/dto/response-user.dto';

type RequestWithCookies = Request & {
  cookies?: Record<string, string | undefined>;
};

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

  /**
   * Rotates the refresh token from the HttpOnly cookie and returns a new access
   * token.
  */
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
    @Req() request: RequestWithCookies,
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

  /**
   * Completes password recovery by validating the reset token and saving the
   * new password hash.
   */
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

  @Get('me')
  @Throttle({ default: { limit: 60, ttl: 60_000, blockDuration: 60_000 } })
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retorna o usuário autenticado.' })
  @ApiOkResponse({ type: ResponseUserDto })
  @ApiUnauthorizedResponse({ description: 'Não autorizado.' })
  me(@CurrentUser() user: JwtPayload): Promise<ResponseUserDto> {
    return this.authService.me(user.sub);
  }

  /**
   * Revokes the refresh token stored in the HttpOnly cookie and clears it from
   * the browser.
   */
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
    @Req() request: RequestWithCookies,
    @Res({ passthrough: true }) response: Response,
  ): Promise<MessageResponseDto> {
    const refreshToken = this.getRefreshTokenFromCookie(request);
    const logoutResult = await this.authService.logout(refreshToken);

    this.clearRefreshTokenCookie(response);

    return logoutResult;
  }

  private getRefreshTokenFromCookie(request: RequestWithCookies): string {
    const refreshToken = this.getOptionalRefreshTokenFromCookie(request);

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token não encontrado.');
    }

    return refreshToken;
  }

  /**
   * Returns the configured refresh token cookie parsed by cookie-parser.
   */
  private getOptionalRefreshTokenFromCookie(
    request: RequestWithCookies,
  ): string | undefined {
    const cookieName = this.getRefreshTokenCookieName();
    return request.cookies?.[cookieName];
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

  private getRefreshTokenCookieName(): string {
    return this.configService.getOrThrow<string>(
      'REFRESH_TOKEN_COOKIE_NAME',
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

  /**
   * Enables the Secure cookie flag when the environment requires HTTPS.
   */
  private isRefreshTokenCookieSecure(): boolean {
    return this.configService.getOrThrow<boolean>(
      'REFRESH_TOKEN_COOKIE_SECURE',
    );
  }

  /**
   * Converts refresh token expiration from days to cookie `maxAge`
   * milliseconds.
   */
  private getRefreshTokenCookieMaxAge(): number {
    const expiresDays = this.configService.getOrThrow<number>(
      'JWT_REFRESH_EXPIRES_DAYS',
    );

    return expiresDays * 24 * 60 * 60 * 1000;
  }
}
