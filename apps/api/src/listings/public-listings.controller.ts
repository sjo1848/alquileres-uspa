import { Controller, Get, Param, Query } from '@nestjs/common';
import { ListingsService } from './listings.service.js';
import { PublicListingsQueryDto } from './public-listings.types.js';

@Controller('public/listings')
export class PublicListingsController {
  constructor(private readonly listings: ListingsService) {}

  @Get()
  list(@Query() query: PublicListingsQueryDto) {
    return this.listings.listPublic(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.listings.getPublic(id);
  }
}
