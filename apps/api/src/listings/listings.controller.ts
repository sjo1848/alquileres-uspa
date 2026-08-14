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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '@prisma/client';
import { AuthGuard, AuthenticatedRequest } from '../auth/auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { ListingsService } from './listings.service.js';
import { ReorderListingImageDto } from './listing-images.types.js';
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

  @Post(':id/submit') submit(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.listings.submit(req.user!.id, id);
  }

  @Get(':id/images') listImages(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.listings.listImages(req.user!.id, id);
  }

  @Post(':id/images')
  @UseInterceptors(
    FileInterceptor('image', {
      limits: {
        fileSize: Number(
          process.env.LISTING_IMAGE_MAX_BYTES ?? 5 * 1024 * 1024,
        ),
      },
    }),
  )
  addImage(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.listings.addImage(req.user!.id, id, file);
  }

  @Delete(':id/images/:imageId')
  removeImage(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('imageId') imageId: string,
  ) {
    return this.listings.removeImage(req.user!.id, id, imageId);
  }

  @Patch(':id/images/:imageId')
  reorderImage(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Param('imageId') imageId: string,
    @Body() input: ReorderListingImageDto,
  ) {
    return this.listings.reorderImage(
      req.user!.id,
      id,
      imageId,
      input.position,
    );
  }
}
