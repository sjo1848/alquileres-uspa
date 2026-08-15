import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service.js';
import { AuthUser } from './auth.types.js';

export type AuthenticatedRequest = Request & { user?: AuthUser };

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;
    const cookieToken = request.headers.cookie
      ?.split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith('alquileres_session='))
      ?.slice('alquileres_session='.length);
    const token = header?.startsWith('Bearer ')
      ? header.slice('Bearer '.length)
      : cookieToken;
    if (!token) {
      throw new UnauthorizedException('Authentication required');
    }
    const payload = this.auth.verify(decodeURIComponent(token));
    request.user = await this.auth.revalidate(payload);
    return true;
  }
}
