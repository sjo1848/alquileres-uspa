import { Role } from '@prisma/client';
import { SetMetadata } from '@nestjs/common';
import { REQUIRED_ROLES } from './roles.guard.js';

export const Roles = (...roles: Role[]) => SetMetadata(REQUIRED_ROLES, roles);
