import { Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import {
  getOptionsToken,
  getStorageToken,
  ThrottlerGuard,
  ThrottlerModuleOptions,
  ThrottlerStorage,
} from '@nestjs/throttler';
import type { Request } from 'express';
import { JwtPayload } from '../../modules/auth/interfaces/jwt-payload.interface';

type RequestWithUser = Request & {
  user?: {
    sub?: string;
  };
};

@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  constructor(
    @Inject(getOptionsToken())
    options: ThrottlerModuleOptions,
    @Inject(getStorageToken())
    storageService: ThrottlerStorage,
    reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {
    super(options, storageService, reflector);
  }

  protected async getTracker(req: RequestWithUser): Promise<string> {
    const authenticatedUserId = req.user?.sub;

    if (authenticatedUserId) {
      return `user:${authenticatedUserId}`;
    }

    const token = this.extractBearerToken(req);

    if (token) {
      const userId = await this.getUserIdFromToken(token);

      if (userId) {
        return `user:${userId}`;
      }
    }

    return `ip:${req.ip ?? req.socket.remoteAddress ?? 'anonymous'}`;
  }

  private extractBearerToken(req: Request): string | undefined {
    const [type, token] = req.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private async getUserIdFromToken(token: string): Promise<string | undefined> {
    try {
      const payload =
        await this.jwtService.verifyAsync<Partial<JwtPayload>>(token);

      return typeof payload.sub === 'string' && payload.sub.length > 0
        ? payload.sub
        : undefined;
    } catch {
      return undefined;
    }
  }
}
