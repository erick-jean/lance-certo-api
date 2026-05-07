import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AuthenticatedRequest } from './interfaces/authenticated-request.interface';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  /**
   * Validates the bearer access token and attaches its decoded payload to the
   * request object.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

      if (!this.isJwtPayload(payload)) {
        throw new UnauthorizedException();
      }

      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.user = payload;
    } catch {
      throw new UnauthorizedException();
    }

    return true;
  }

  /**
   * Extracts the bearer token from the Authorization header.
   */
  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  /**
   * Performs runtime validation of the JWT payload shape before trusting it.
   */
  private isJwtPayload(payload: unknown): payload is JwtPayload {
    if (!payload || typeof payload !== 'object') {
      return false;
    }

    const candidate = payload as Record<string, unknown>;

    return (
      typeof candidate.sub === 'string' &&
      candidate.sub.length > 0 &&
      typeof candidate.email === 'string' &&
      candidate.email.length > 0 &&
      typeof candidate.role === 'string' &&
      candidate.role.length > 0
    );
  }
}
