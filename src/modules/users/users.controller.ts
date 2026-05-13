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
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { AuthGuard } from '../auth/auth.guard';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { ChangeMyPasswordDto } from './dto/change-my-password.dto';
import { ResponseUserDto } from './dto/response-user.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Unauthorized.' })
@UseGuards(AuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @Throttle({ default: { limit: 60, ttl: 60_000, blockDuration: 60_000 } })
  @ApiOperation({ summary: 'Busca os dados do usuário autenticado.' })
  @ApiOkResponse({ type: ResponseUserDto })
  findMe(@Req() req: AuthenticatedRequest): Promise<ResponseUserDto> {
    return this.usersService.findMe(req.user.sub);
  }

  @Patch('me')
  @Throttle({ default: { limit: 30, ttl: 60_000, blockDuration: 120_000 } })
  @ApiOperation({ summary: 'Atualiza os dados do usuário autenticado.' })
  @ApiOkResponse({ type: ResponseUserDto })
  @ApiBadRequestResponse({ description: 'Invalid request.' })
  updateMe(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateMeDto,
  ): Promise<ResponseUserDto> {
    return this.usersService.updateMe(req.user.sub, dto);
  }

  @Patch('me/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 10, ttl: 60_000, blockDuration: 300_000 } })
  @ApiOperation({ summary: 'Altera a senha do usuário autenticado.' })
  @ApiNoContentResponse({ description: 'Password changed successfully.' })
  @ApiBadRequestResponse({
    description: 'Invalid current password or invalid request.',
  })
  changeMyPassword(
    @Req() req: AuthenticatedRequest,
    @Body() dto: ChangeMyPasswordDto,
  ): Promise<void> {
    return this.usersService.changeMyPassword(req.user.sub, dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Throttle({ default: { limit: 60, ttl: 60_000, blockDuration: 60_000 } })
  @ApiOperation({ summary: 'Lista usuários. Somente ADMIN.' })
  @ApiOkResponse({ type: ResponseUserDto, isArray: true })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
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
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiNotFoundResponse({ description: 'User not found.' })
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
  @ApiBadRequestResponse({ description: 'Invalid request.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiNotFoundResponse({ description: 'User not found.' })
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
  @ApiBadRequestResponse({ description: 'Invalid request.' })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiNotFoundResponse({ description: 'User not found.' })
  updateStatus(
    @Req() req: AuthenticatedRequest,
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Body() dto: UpdateUserStatusDto,
  ): Promise<ResponseUserDto> {
    return this.usersService.updateStatus(req.user.sub, userId, dto);
  }

  @Delete(':userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 10, ttl: 60_000, blockDuration: 300_000 } })
  @ApiOperation({ summary: 'Remove ou desativa usuário. Somente ADMIN.' })
  @ApiParam({ name: 'userId', type: String, format: 'uuid' })
  @ApiNoContentResponse({
    description: 'User deleted or deactivated successfully.',
  })
  @ApiForbiddenResponse({ description: 'Forbidden.' })
  @ApiNotFoundResponse({ description: 'User not found.' })
  removeById(
    @Req() req: AuthenticatedRequest,
    @Param('userId', new ParseUUIDPipe()) userId: string,
  ): Promise<void> {
    return this.usersService.removeById(req.user.sub, userId);
  }
}
