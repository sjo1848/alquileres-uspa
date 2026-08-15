import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AdminAuditModule } from '../audit/admin-audit.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ListingsController } from './listings.controller.js';
import {
  AdminListingsController,
  AdminOwnersController,
} from './admin-listings.controller.js';
import { PublicListingsController } from './public-listings.controller.js';
import { ListingsService } from './listings.service.js';
import {
  LISTING_IMAGE_STORAGE,
  LocalListingImageStorage,
} from './listing-image.storage.js';

@Module({
  imports: [PrismaModule, AuthModule, AdminAuditModule],
  controllers: [
    ListingsController,
    AdminListingsController,
    AdminOwnersController,
    PublicListingsController,
  ],
  providers: [
    ListingsService,
    LocalListingImageStorage,
    { provide: LISTING_IMAGE_STORAGE, useExisting: LocalListingImageStorage },
  ],
})
export class ListingsModule {}
