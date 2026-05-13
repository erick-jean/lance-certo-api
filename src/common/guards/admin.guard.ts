import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthenticatedRequest } from 'src/modules/auth/interfaces/authenticated-request.interface';

@Injectable()
export class AdminGuard implements CanActivate {
  /**
   * This guard must run after AuthGuard, because AuthGuard is responsible for
   * validating the JWT and attaching `user` to the request.
   */
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    /**
     * The role must come from the authenticated JWT payload, never from params,
     * query string or request body.
     */
    if (request.user.role !== 'admin') {
      throw new ForbiddenException('Acesso administrativo necessário.');
    }

    return true;
  }
}
