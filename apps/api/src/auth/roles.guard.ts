import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthService } from './auth.service.js';
import { AuthenticatedRequest } from './auth.guard.js';

export const REQUIRED_ROLES = Symbol('required_roles');

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = (Reflect.getMetadata(REQUIRED_ROLES, context.getHandler()) ??
      Reflect.getMetadata(REQUIRED_ROLES, context.getClass())) as
      Role[] | undefined;
    if (!roles?.length) return true;
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user) return false;
    this.auth.assertRole(request.user, roles);
    return true;
  }
}
