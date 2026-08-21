import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ContactEventState,
  ListingPublicationStatus,
  ListingStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { ContactAcceptedDto, CreateContactEventDto } from './contact.types.js';

const OWNER_CONTACT_EVENT_SELECT = {
  id: true,
  state: true,
  visitorName: true,
  visitorEmail: true,
  message: true,
  createdAt: true,
  listing: { select: { id: true, title: true, location: true } },
} satisfies Prisma.ContactEventSelect;

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
        state: ContactEventState.UNREAD,
      },
    });
    return { status: 'RECEIVED' };
  }

  async listMine(ownerId: string) {
    const where = { ownerId, listing: { ownerId } };
    const [items, unreadCount] = await Promise.all([
      this.prisma.contactEvent.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: OWNER_CONTACT_EVENT_SELECT,
      }),
      this.prisma.contactEvent.count({
        where: { ...where, state: ContactEventState.UNREAD },
      }),
    ]);
    return { items, unreadCount };
  }

  async getMine(ownerId: string, id: string) {
    const event = await this.prisma.contactEvent.findFirst({
      where: { id, ownerId, listing: { ownerId } },
      select: OWNER_CONTACT_EVENT_SELECT,
    });
    if (!event) throw new NotFoundException('Contact event not found');
    return event;
  }

  async updateState(ownerId: string, id: string, state: ContactEventState) {
    const result = await this.prisma.contactEvent.updateMany({
      where: { id, ownerId, listing: { ownerId } },
      data: { state },
    });
    if (result.count !== 1) {
      throw new NotFoundException('Contact event not found');
    }
    return this.getMine(ownerId, id);
  }
}
