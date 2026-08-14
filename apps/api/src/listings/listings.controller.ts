import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthGuard, AuthenticatedRequest } from '../auth/auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { ListingsService } from './listings.service.js';
import { CreateListingDto, UpdateListingDto } from './listings.types.js';

@Controller('listings')
@Roles(Role.OWNER)
@UseGuards(AuthGuard, RolesGuard)
export class ListingsController {
  constructor(private readonly listings: ListingsService) {}
  @Get() list(@Req() req: AuthenticatedRequest) {
    return this.listings.listMine(req.user!.id);
  }
  @Post() create(
    @Req() req: AuthenticatedRequest,
    @Body() input: CreateListingDto,
  ) {
    return this.listings.create(req.user!.id, input);
  }
  @Get(':id') get(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.listings.getMine(req.user!.id, id);
  }
  @Patch(':id') update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() input: UpdateListingDto,
  ) {
    return this.listings.update(req.user!.id, id, input);
  }
  @Delete(':id') async remove(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    await this.listings.remove(req.user!.id, id);
  }
}
