import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import {
  IsEnum,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { AuthGuard, AuthenticatedRequest } from '../auth/auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { ListingsService } from './listings.service.js';
import { CreateListingDto, UpdateListingDto } from './listings.types.js';
import { ListingAvailabilityStatus } from '@prisma/client';

class AssistedCreateListingDto extends CreateListingDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  ownerId!: string;
}

class AssistedAvailabilityDto {
  @IsEnum(ListingAvailabilityStatus)
  availabilityStatus!: ListingAvailabilityStatus;
}

class RejectListingDto {
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  @Matches(/\S/)
  reason!: string;
}

@Controller('admin/listings')
@Roles(Role.ADMIN)
@UseGuards(AuthGuard, RolesGuard)
export class AdminListingsController {
  constructor(private readonly listings: ListingsService) {}
  @Get('review') listForReview() {
    return this.listings.listForReview();
  }
  @Post(':id/approve') async approve(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.listings.approve(req.user!, id);
  }
  @Post(':id/publish') async publish(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.listings.publish(req.user!, id);
  }
  @Post(':id/reject') async reject(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() input: RejectListingDto,
  ) {
    return this.listings.reject(req.user!, id, input.reason);
  }

  @Get('audit') auditLog(@Query('listingId') listingId?: string) {
    return this.listings.listAudit(listingId);
  }

  @Post('assisted') createAssisted(
    @Req() req: AuthenticatedRequest,
    @Body() input: AssistedCreateListingDto,
  ) {
    const { ownerId, ...listing } = input;
    return this.listings.createAssisted(req.user!, ownerId, listing);
  }

  @Patch('assisted/:id') updateAssisted(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() input: UpdateListingDto,
  ) {
    return this.listings.updateAssisted(req.user!, id, input);
  }

  @Patch('assisted/:id/availability') updateAvailabilityAssisted(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() input: AssistedAvailabilityDto,
  ) {
    return this.listings.updateAvailabilityAssisted(req.user!, id, input);
  }

  @Post('assisted/:id/reconfirm') reconfirmAssisted(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.listings.reconfirmAssisted(req.user!, id);
  }

  @Post('assisted/:id/submit') submitAssisted(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.listings.submitAssisted(req.user!, id);
  }

  @Delete('assisted/:id') removeAssisted(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.listings.removeAssisted(req.user!, id);
  }
}
