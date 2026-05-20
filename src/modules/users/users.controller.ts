import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Authenticated } from 'src/common/decorators/authenticated.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { ChangeMyPasswordDto } from './dto/change-my-password.dto';
import { ResponseUserDto } from './dto/response-user.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@Authenticated()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @Throttle({ default: { limit: 60, ttl: 60_000, blockDuration: 60_000 } })
  @ApiOperation({ summary: 'Busca os dados do usuário autenticado.' })
  @ApiOkResponse({ type: ResponseUserDto })
  findMe(@CurrentUser() user: JwtPayload): Promise<ResponseUserDto> {
    return this.usersService.findMe(user.sub);
  }

  @Patch('me')
  @Throttle({ default: { limit: 30, ttl: 60_000, blockDuration: 120_000 } })
  @ApiOperation({ summary: 'Atualiza os dados do usuário autenticado.' })
  @ApiOkResponse({ type: ResponseUserDto })
  @ApiBadRequestResponse({ description: 'Requisição inválida.' })
  updateMe(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateMeDto,
  ): Promise<ResponseUserDto> {
    return this.usersService.updateMe(user.sub, dto);
  }

  @Patch('me/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 10, ttl: 60_000, blockDuration: 300_000 } })
  @ApiOperation({ summary: 'Altera a senha do usuário autenticado.' })
  @ApiNoContentResponse({ description: 'Senha alterada com sucesso.' })
  @ApiBadRequestResponse({
    description: 'Senha atual inválida ou requisição inválida.',
  })
  changeMyPassword(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ChangeMyPasswordDto,
  ): Promise<void> {
    return this.usersService.changeMyPassword(user.sub, dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Throttle({ default: { limit: 60, ttl: 60_000, blockDuration: 60_000 } })
  @ApiOperation({ summary: 'Lista usuários. Somente ADMIN.' })
  @ApiOkResponse({ type: ResponseUserDto, isArray: true })
  @ApiForbiddenResponse({ description: 'Acesso negado.' })
  findAll(): Promise<ResponseUserDto[]> {
    return this.usersService.findAll();
  }

  @Get(':userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Throttle({ default: { limit: 60, ttl: 60_000, blockDuration: 60_000 } })
  @ApiOperation({ summary: 'Busca usuário por id. Somente ADMIN.' })
  @ApiParam({ name: 'userId', type: String, format: 'uuid' })
  @ApiOkResponse({ type: ResponseUserDto })
  @ApiForbiddenResponse({ description: 'Acesso negado.' })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado.' })
  findById(
    @Param('userId', new ParseUUIDPipe()) userId: string,
  ): Promise<ResponseUserDto> {
    return this.usersService.findById(userId);
  }

  @Patch(':userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Throttle({ default: { limit: 30, ttl: 60_000, blockDuration: 120_000 } })
  @ApiOperation({ summary: 'Atualiza usuário por id. Somente ADMIN.' })
  @ApiParam({ name: 'userId', type: String, format: 'uuid' })
  @ApiOkResponse({ type: ResponseUserDto })
  @ApiBadRequestResponse({ description: 'Requisição inválida.' })
  @ApiForbiddenResponse({ description: 'Acesso negado.' })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado.' })
  updateById(
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Body() dto: UpdateUserDto,
  ): Promise<ResponseUserDto> {
    return this.usersService.updateById(userId, dto);
  }

  @Patch(':userId/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Throttle({ default: { limit: 30, ttl: 60_000, blockDuration: 120_000 } })
  @ApiOperation({ summary: 'Ativa ou inativa usuário. Somente ADMIN.' })
  @ApiParam({ name: 'userId', type: String, format: 'uuid' })
  @ApiOkResponse({ type: ResponseUserDto })
  @ApiBadRequestResponse({ description: 'Requisição inválida.' })
  @ApiForbiddenResponse({ description: 'Acesso negado.' })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado.' })
  updateStatus(
    @CurrentUser() user: JwtPayload,
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Body() dto: UpdateUserStatusDto,
  ): Promise<ResponseUserDto> {
    return this.usersService.updateStatus(user.sub, userId, dto);
  }

  @Delete(':userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 10, ttl: 60_000, blockDuration: 300_000 } })
  @ApiOperation({ summary: 'Remove ou desativa usuário. Somente ADMIN.' })
  @ApiParam({ name: 'userId', type: String, format: 'uuid' })
  @ApiNoContentResponse({
    description: 'Usuário removido ou desativado com sucesso.',
  })
  @ApiForbiddenResponse({ description: 'Acesso negado.' })
  @ApiNotFoundResponse({ description: 'Usuário não encontrado.' })
  removeById(
    @CurrentUser() user: JwtPayload,
    @Param('userId', new ParseUUIDPipe()) userId: string,
  ): Promise<void> {
    return this.usersService.removeById(user.sub, userId);
  }
}
