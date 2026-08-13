import { Role } from '@prisma/client';

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
};

export type AuthTokenPayload = AuthUser & { iat?: number; exp?: number };
