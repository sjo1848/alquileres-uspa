import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { Role } from '@prisma/client';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { AuthGuard, AuthenticatedRequest } from './auth.guard.js';
import { AuthService, normalizeEmail } from './auth.service.js';
import { Roles } from './roles.decorator.js';
import { RolesGuard } from './roles.guard.js';

class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

class RegisterOwnerDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  async register(
    @Body() input: RegisterOwnerDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.auth.registerOwner(
      normalizeEmail(input.email),
      input.password,
    );
    this.setSessionCookie(response, this.auth.sign(user));
    return { user };
  }

  @Post('login')
  async login(
    @Body() input: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.auth.validateCredentials(
      normalizeEmail(input.email),
      input.password,
    );
    this.setSessionCookie(response, this.auth.sign(user));
    return { user };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@Req() request: AuthenticatedRequest) {
    return request.user;
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('alquileres_session', this.cookieOptions());
    return { ok: true };
  }

  private setSessionCookie(response: Response, token: string) {
    response.cookie('alquileres_session', token, this.cookieOptions());
  }

  private cookieOptions() {
    return {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60 * 1000,
      path: '/',
    };
  }

  @Get('admin-check')
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  adminCheck() {
    return { role: Role.ADMIN, foundation: true };
  }
}
