import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ListingsModule } from './listings/listings.module.js';
import { ContactModule } from './contact/contact.module.js';

@Module({ imports: [PrismaModule, AuthModule, ListingsModule, ContactModule] })
export class AppModule {}
