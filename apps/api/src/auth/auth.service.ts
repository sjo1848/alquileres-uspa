import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthTokenPayload, AuthUser } from './auth.types.js';

@Injectable()
export class AuthService {
  private readonly jwtSecret = process.env.JWT_SECRET ?? '';
  private readonly jwtExpiresIn = process.env.JWT_EXPIRES_IN ?? '15m';

  constructor(private readonly prisma: PrismaService) {
    if (!this.jwtSecret) {
      throw new Error('JWT_SECRET must be configured');
    }
  }

  async validateCredentials(
    email: string,
    password: string,
  ): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return { id: user.id, email: user.email, role: user.role };
  }

  sign(user: AuthUser): string {
    return jwt.sign(user, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn as jwt.SignOptions['expiresIn'],
    });
  }

  verify(token: string): AuthTokenPayload {
    try {
      return jwt.verify(token, this.jwtSecret) as AuthTokenPayload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  assertRole(user: AuthUser, allowedRoles: Role[]): void {
    if (!allowedRoles.includes(user.role)) {
      throw new UnauthorizedException('Insufficient role');
    }
  }
}
