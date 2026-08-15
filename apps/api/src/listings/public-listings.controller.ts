import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ListingsService } from './listings.service.js';
import { PublicListingsQueryDto } from './public-listings.types.js';

@Controller('public/listings')
export class PublicListingsController {
  constructor(private readonly listings: ListingsService) {}

  @Get()
  list(
    @Query() query: PublicListingsQueryDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    response.setHeader('Cache-Control', 'no-store, no-cache');
    return this.listings.listPublic(query);
  }

  @Get(':id/images/:imageId')
  async image(
    @Param('id') id: string,
    @Param('imageId') imageId: string,
    @Res() response: Response,
  ) {
    const image = await this.listings.getPublicImage(id, imageId);
    response.setHeader('Content-Type', image.contentType);
    response.setHeader('Content-Length', image.sizeBytes);
    response.setHeader('Cache-Control', 'no-store, no-cache');
    return response.send(image.content);
  }

  @Get(':id')
  get(@Param('id') id: string, @Res({ passthrough: true }) response: Response) {
    response.setHeader('Cache-Control', 'no-store, no-cache');
    return this.listings.getPublic(id);
  }
}
