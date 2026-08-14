import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { AuthGuard, AuthenticatedRequest } from './auth.guard.js';
import { AuthService } from './auth.service.js';
import { Roles } from './roles.decorator.js';
import { RolesGuard } from './roles.guard.js';

class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  async login(@Body() input: LoginDto) {
    const user = await this.auth.validateCredentials(
      input.email,
      input.password,
    );
    return { accessToken: this.auth.sign(user), user };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@Req() request: AuthenticatedRequest) {
    return request.user;
  }

  @Get('admin-check')
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  adminCheck() {
    return { role: Role.ADMIN, foundation: true };
  }
}
