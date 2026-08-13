import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service.js';
import { AuthUser } from './auth.types.js';

export type AuthenticatedRequest = Request & { user?: AuthUser };

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return false;
    }
    const payload = this.auth.verify(header.slice('Bearer '.length));
    request.user = { id: payload.id, email: payload.email, role: payload.role };
    return true;
  }
}
