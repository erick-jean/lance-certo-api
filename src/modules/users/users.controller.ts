import { Controller, Get, Param } from '@nestjs/common';
import { RegisterUserDto } from '../auth/dto/register-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':email')
  findByEmail(@Param('email') email: string) {
    return this.usersService.findOne(email);
  }
}
