import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ListingsModule } from './listings/listings.module.js';
import { ContactModule } from './contact/contact.module.js';
import { AdminAuditModule } from './audit/admin-audit.module.js';
import { HealthModule } from './health/health.module.js';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AdminAuditModule,
    ListingsModule,
    ContactModule,
    HealthModule,
  ],
})
export class AppModule {}
