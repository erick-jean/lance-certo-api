import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Returns a user profile by email for the owner or admin users.
   */
  @Get(':email')
  @ApiOkResponse({ type: UserResponseDto })
  @ApiForbiddenResponse({ description: 'Cannot access another user profile' })
  @ApiNotFoundResponse({ description: 'User not found' })
  findByEmail(
    @Param('email') email: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<UserResponseDto> {
    return this.usersService.findOne(email, req.user);
  }
}
