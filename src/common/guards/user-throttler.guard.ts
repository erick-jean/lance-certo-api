import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';

type RequestWithUser = Request & {
  user?: {
    sub?: string;
  };
};

@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: RequestWithUser): Promise<string> {
    return Promise.resolve(req.user?.sub ?? req.ip ?? 'anonymous');
  }
}