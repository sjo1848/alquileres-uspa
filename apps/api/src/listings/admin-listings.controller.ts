import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { AuthGuard } from '../auth/auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { ListingsService } from './listings.service.js';

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
  @Post(':id/approve') approve(@Param('id') id: string) {
    return this.listings.approve(id);
  }
  @Post(':id/publish') publish(@Param('id') id: string) {
    return this.listings.publish(id);
  }
  @Post(':id/reject') reject(
    @Param('id') id: string,
    @Body() input: RejectListingDto,
  ) {
    return this.listings.reject(id, input.reason);
  }
}
