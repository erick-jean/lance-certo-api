import { createParamDecorator } from '@nestjs/common';
import { JwtPayload } from '../../modules/auth/interfaces/jwt-payload.interface';

export const CurrentUser = createParamDecorator<unknown, JwtPayload>(
  (_data, context): JwtPayload => {
    const request = context.switchToHttp().getRequest<{ user: JwtPayload }>();

    return request.user;
  },
);
