import { Injectable, NotFoundException } from '@nestjs/common';
import { ListingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateListingDto, UpdateListingDto } from './listings.types.js';

@Injectable()
export class ListingsService {
  constructor(private readonly prisma: PrismaService) {}

  listMine(ownerId: string) {
    return this.prisma.listing.findMany({
      where: { ownerId, status: ListingStatus.DRAFT },
      orderBy: { updatedAt: 'desc' },
    });
  }

  create(ownerId: string, input: CreateListingDto) {
    return this.prisma.listing.create({
      data: { ...input, ownerId, status: ListingStatus.DRAFT },
    });
  }

  async getMine(ownerId: string, id: string) {
    const listing = await this.prisma.listing.findFirst({
      where: { id, ownerId, status: ListingStatus.DRAFT },
    });
    if (!listing) throw new NotFoundException('Listing not found');
    return listing;
  }

  async update(ownerId: string, id: string, input: UpdateListingDto) {
    const result = await this.prisma.listing.updateMany({
      where: { id, ownerId, status: ListingStatus.DRAFT },
      data: input,
    });
    if (result.count === 0) throw new NotFoundException('Listing not found');
    return this.getMine(ownerId, id);
  }

  async remove(ownerId: string, id: string) {
    const result = await this.prisma.listing.deleteMany({
      where: { id, ownerId, status: ListingStatus.DRAFT },
    });
    if (result.count === 0) throw new NotFoundException('Listing not found');
  }
}
