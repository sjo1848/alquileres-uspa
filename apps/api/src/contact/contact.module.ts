import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import {
  ContactController,
  OwnerContactController,
} from './contact.controller.js';
import { ContactService } from './contact.service.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ContactController, OwnerContactController],
  providers: [ContactService],
})
export class ContactModule {}
