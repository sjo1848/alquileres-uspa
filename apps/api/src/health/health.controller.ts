import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check(@Res() response: Response) {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return response.status(HttpStatus.OK).json({
        status: 'ok',
        checks: { database: 'ok' },
      });
    } catch {
      return response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        status: 'degraded',
        checks: { database: 'unavailable' },
      });
    }
  }
}
