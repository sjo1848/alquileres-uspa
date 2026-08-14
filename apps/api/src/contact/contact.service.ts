import { Injectable, NotFoundException } from '@nestjs/common';
import { ListingPublicationStatus, ListingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { ContactAcceptedDto, CreateContactEventDto } from './contact.types.js';

@Injectable()
export class ContactService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    listingId: string,
    input: CreateContactEventDto,
  ): Promise<ContactAcceptedDto> {
    const listing = await this.prisma.listing.findFirst({
      where: {
        id: listingId,
        status: ListingStatus.APPROVED,
        publicationStatus: ListingPublicationStatus.PUBLISHED,
      },
      select: { id: true, ownerId: true },
    });
    if (!listing) throw new NotFoundException('Listing not found');
    await this.prisma.contactEvent.create({
      data: {
        listingId: listing.id,
        ownerId: listing.ownerId,
        visitorName: input.visitorName.trim(),
        visitorEmail: input.visitorEmail.trim().toLowerCase(),
        message: input.message.trim(),
      },
    });
    return { status: 'RECEIVED' };
  }
}
