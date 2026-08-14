import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ListingsModule } from './listings/listings.module.js';

@Module({ imports: [PrismaModule, AuthModule, ListingsModule] })
export class AppModule {}
