import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UserRole } from 'src/common/enums/user-role.enum';
import { AuthenticatedRequest } from 'src/modules/auth/interfaces/authenticated-request.interface';

@Injectable()
export class AdminGuard implements CanActivate {
  /**
   * This guard must run after AuthGuard, because AuthGuard is responsible for
   * validating the JWT and attaching `user` to the request.
   */
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (request.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Acesso administrativo necessário.');
    }

    return true;
  }
}
