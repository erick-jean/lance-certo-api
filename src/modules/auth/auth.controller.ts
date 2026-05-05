import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { ForgotPasswordDto } from '../auth/dto/forgot-password.dto'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registra um novo usuario' })
  @ApiCreatedResponse({ type: UserResponseDto })
  register(@Body() registerDto: RegisterUserDto): Promise<UserResponseDto> {
    return this.authService.register(registerDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({ summary: 'Autentica um usuario e retorna um token JWT' })
  @ApiOkResponse({ type: AuthResponseDto })
  signIn(@Body() signInDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.signIn(signInDto);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Solicitar recuperação de senha' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }
}
