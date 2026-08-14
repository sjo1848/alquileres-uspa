import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  ListingPublicationStatus,
  ListingAvailabilityStatus,
  ListingStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  LISTING_IMAGE_STORAGE,
  ListingImageStorage,
} from './listing-image.storage.js';
import { validateListingImage } from './listing-images.validator.js';
import { CreateListingDto, UpdateListingDto } from './listings.types.js';
import {
  PublicListingDto,
  PublicListingsPageDto,
  PublicListingsQueryDto,
} from './public-listings.types.js';

const PUBLIC_LISTING_SELECT = {
  id: true,
  title: true,
  description: true,
  location: true,
  pricePerNight: true,
  maxGuests: true,
  availabilityStatus: true,
  lastConfirmedAt: true,
  images: {
    orderBy: [{ position: 'asc' as const }, { id: 'asc' as const }],
    select: { id: true, contentType: true, sizeBytes: true, position: true },
  },
} satisfies Prisma.ListingSelect;

const FRESHNESS_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class ListingsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(LISTING_IMAGE_STORAGE)
    private readonly imageStorage: ListingImageStorage,
  ) {}

  listMine(ownerId: string) {
    return this.prisma.listing.findMany({
      where: { ownerId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async listPublic(
    query: PublicListingsQueryDto,
  ): Promise<PublicListingsPageDto> {
    if (
      query.minPricePerNight !== undefined &&
      query.maxPricePerNight !== undefined &&
      query.minPricePerNight > query.maxPricePerNight
    )
      throw new BadRequestException(
        'minPricePerNight cannot exceed maxPricePerNight',
      );

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.ListingWhereInput = {
      status: ListingStatus.APPROVED,
      publicationStatus: ListingPublicationStatus.PUBLISHED,
      ...(query.location
        ? { location: { contains: query.location, mode: 'insensitive' } }
        : {}),
      ...(query.maxGuests !== undefined
        ? { maxGuests: { gte: query.maxGuests } }
        : {}),
      ...(query.minPricePerNight !== undefined ||
      query.maxPricePerNight !== undefined
        ? {
            pricePerNight: {
              ...(query.minPricePerNight !== undefined
                ? { gte: query.minPricePerNight }
                : {}),
              ...(query.maxPricePerNight !== undefined
                ? { lte: query.maxPricePerNight }
                : {}),
            },
          }
        : {}),
    };
    const [items, totalItems] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: PUBLIC_LISTING_SELECT,
      }),
      this.prisma.listing.count({ where }),
    ]);
    return {
      items: items.map((item) => this.toPublicListing(item)),
      page,
      pageSize,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
    };
  }

  async getPublic(id: string): Promise<PublicListingDto> {
    const listing = await this.prisma.listing.findFirst({
      where: {
        id,
        status: ListingStatus.APPROVED,
        publicationStatus: ListingPublicationStatus.PUBLISHED,
      },
      select: PUBLIC_LISTING_SELECT,
    });
    if (!listing) throw new NotFoundException('Listing not found');
    return this.toPublicListing(listing);
  }

  private toPublicListing(listing: {
    id: string;
    title: string;
    description: string;
    location: string;
    pricePerNight: number;
    maxGuests: number;
    availabilityStatus: ListingAvailabilityStatus;
    lastConfirmedAt: Date;
    images: Array<{
      id: string;
      contentType: string;
      sizeBytes: number;
      position: number;
    }>;
  }): PublicListingDto {
    return {
      id: listing.id,
      title: listing.title,
      description: listing.description,
      location: listing.location,
      pricePerNight: listing.pricePerNight,
      maxGuests: listing.maxGuests,
      availabilityStatus: listing.availabilityStatus,
      lastConfirmedAt: listing.lastConfirmedAt,
      freshnessStatus:
        Date.now() - listing.lastConfirmedAt.getTime() <= FRESHNESS_WINDOW_MS
          ? 'FRESH'
          : 'STALE',
      images: listing.images.map(
        ({ id, contentType, sizeBytes, position }) => ({
          id,
          contentType,
          sizeBytes,
          position,
        }),
      ),
    };
  }

  create(ownerId: string, input: CreateListingDto) {
    return this.prisma.listing.create({
      data: { ...input, ownerId, status: ListingStatus.DRAFT },
    });
  }

  async getMine(ownerId: string, id: string) {
    const listing = await this.prisma.listing.findFirst({
      where: { id, ownerId },
    });
    if (!listing) throw new NotFoundException('Listing not found');
    return listing;
  }

  async submit(ownerId: string, id: string) {
    return this.withListingLock(id, async (db) => {
      const listing = await db.listing.findFirst({
        where: { id, ownerId },
        select: { status: true },
      });
      if (!listing) throw new NotFoundException('Listing not found');
      if (listing.status === ListingStatus.SUBMITTED)
        return db.listing.findUnique({ where: { id } });
      if (
        listing.status !== ListingStatus.DRAFT &&
        listing.status !== ListingStatus.REJECTED
      )
        throw new ConflictException(
          'Listing cannot be submitted in its current status',
        );
      const result = await db.listing.updateMany({
        where: { id, ownerId, status: listing.status },
        data: { status: ListingStatus.SUBMITTED, rejectionReason: null },
      });
      if (result.count !== 1)
        throw new ConflictException('Listing changed during submission');
      return db.listing.findUnique({ where: { id } });
    });
  }

  listForReview() {
    return this.prisma.listing.findMany({
      where: { status: ListingStatus.SUBMITTED },
      orderBy: { updatedAt: 'asc' },
    });
  }

  async approve(id: string) {
    return this.withListingLock(id, async (db) => {
      const listing = await db.listing.findUnique({
        where: { id },
        select: { status: true },
      });
      if (!listing) throw new NotFoundException('Listing not found');
      if (listing.status === ListingStatus.APPROVED)
        return db.listing.findUnique({ where: { id } });
      if (listing.status !== ListingStatus.SUBMITTED)
        throw new ConflictException('Listing is not awaiting review');
      const result = await db.listing.updateMany({
        where: { id, status: ListingStatus.SUBMITTED },
        data: { status: ListingStatus.APPROVED, rejectionReason: null },
      });
      if (!result.count)
        throw new ConflictException('Listing is not awaiting review');
      return db.listing.findUnique({ where: { id } });
    });
  }

  async publish(id: string) {
    return this.withListingLock(id, async (db) => {
      const listing = await db.listing.findUnique({
        where: { id },
        select: { status: true, publicationStatus: true },
      });
      if (!listing) throw new NotFoundException('Listing not found');
      if (listing.publicationStatus === ListingPublicationStatus.PUBLISHED)
        return db.listing.findUnique({ where: { id } });
      if (
        listing.status !== ListingStatus.APPROVED ||
        listing.publicationStatus !== ListingPublicationStatus.UNPUBLISHED
      )
        throw new ConflictException(
          'Only an approved unpublished listing can be published',
        );
      const result = await db.listing.updateMany({
        where: {
          id,
          status: ListingStatus.APPROVED,
          publicationStatus: ListingPublicationStatus.UNPUBLISHED,
        },
        data: { publicationStatus: ListingPublicationStatus.PUBLISHED },
      });
      if (!result.count)
        throw new ConflictException(
          'Only an approved unpublished listing can be published',
        );
      return db.listing.findUnique({ where: { id } });
    });
  }

  async reject(id: string, reason: string) {
    if (typeof reason !== 'string' || reason.trim().length === 0)
      throw new BadRequestException('Rejection reason cannot be blank');
    return this.withListingLock(id, async (db) => {
      const listing = await db.listing.findUnique({
        where: { id },
        select: { status: true, rejectionReason: true },
      });
      if (!listing) throw new NotFoundException('Listing not found');
      if (listing.status === ListingStatus.REJECTED) {
        if (listing.rejectionReason === reason)
          return db.listing.findUnique({ where: { id } });
        throw new ConflictException(
          'Listing already rejected with another reason',
        );
      }
      if (listing.status !== ListingStatus.SUBMITTED)
        throw new ConflictException('Listing is not awaiting review');
      const result = await db.listing.updateMany({
        where: { id, status: ListingStatus.SUBMITTED },
        data: { status: ListingStatus.REJECTED, rejectionReason: reason },
      });
      if (!result.count)
        throw new ConflictException('Listing is not awaiting review');
      return db.listing.findUnique({ where: { id } });
    });
  }

  async update(ownerId: string, id: string, input: UpdateListingDto) {
    const result = await this.prisma.listing.updateMany({
      where: { id, ownerId, status: ListingStatus.DRAFT },
      data: input,
    });
    if (result.count === 0) throw new NotFoundException('Listing not found');
    return this.getMine(ownerId, id);
  }

  async updateAvailability(
    ownerId: string,
    id: string,
    input: { availabilityStatus: ListingAvailabilityStatus },
  ) {
    const result = await this.prisma.listing.updateMany({
      where: { id, ownerId },
      data: {
        availabilityStatus: input.availabilityStatus,
        lastConfirmedAt: new Date(),
      },
    });
    if (result.count === 0) throw new NotFoundException('Listing not found');
    return this.getMine(ownerId, id);
  }

  async reconfirm(ownerId: string, id: string) {
    const result = await this.prisma.listing.updateMany({
      where: { id, ownerId },
      data: { lastConfirmedAt: new Date() },
    });
    if (result.count === 0) throw new NotFoundException('Listing not found');
    return this.getMine(ownerId, id);
  }

  async remove(ownerId: string, id: string) {
    return this.withListingLock(id, async (db) => {
      await this.assertOwnedDraft(db, ownerId, id);
      const images = await db.listingImage.findMany({
        where: { listingId: id },
      });
      const backups = await Promise.all(
        images.map(async (image: { objectKey: string }) => ({
          key: image.objectKey,
          content: await this.imageStorage!.get(image.objectKey),
        })),
      );
      const deleted: Array<{ key: string; content: Buffer }> = [];
      try {
        for (const backup of backups) {
          await this.imageStorage!.delete(backup.key);
          deleted.push(backup);
        }
        const result = await db.listing.deleteMany({
          where: { id, ownerId, status: ListingStatus.DRAFT },
        });
        if (result.count !== 1)
          throw new NotFoundException('Listing not found');
      } catch (error) {
        await this.restoreObjects(deleted, error);
        throw error;
      }
    });
  }

  async listImages(ownerId: string, listingId: string) {
    await this.assertOwnedDraft(this.prisma, ownerId, listingId);
    return this.prisma.listingImage.findMany({
      where: { listingId },
      orderBy: { position: 'asc' },
      select: {
        id: true,
        originalName: true,
        contentType: true,
        sizeBytes: true,
        position: true,
        createdAt: true,
      },
    });
  }

  async addImage(
    ownerId: string,
    listingId: string,
    file: Express.Multer.File,
  ) {
    const validated = validateListingImage(file);
    const maxImages = Number(process.env.LISTING_IMAGE_MAX_COUNT ?? 20);
    if (!Number.isSafeInteger(maxImages) || maxImages < 1)
      throw new Error('Invalid LISTING_IMAGE_MAX_COUNT');
    return this.withListingLock(listingId, async (db) => {
      await this.assertOwnedDraft(db, ownerId, listingId);
      const count = await db.listingImage.count({
        where: { listingId },
      });
      if (count >= maxImages)
        throw new ConflictException('Listing image limit reached');
      const objectKey = `listings/${listingId}/${randomUUID()}.${validated.extension}`;
      try {
        await this.imageStorage!.put(objectKey, file.buffer);
      } catch (error) {
        await this.bestEffortDelete(objectKey, error);
        throw error;
      }
      try {
        const image = await db.listingImage.create({
          data: {
            listingId,
            objectKey,
            originalName: file.originalname,
            contentType: validated.contentType,
            sizeBytes: validated.sizeBytes,
            position: count,
          },
          select: {
            id: true,
            originalName: true,
            contentType: true,
            sizeBytes: true,
            position: true,
            createdAt: true,
          },
        });
        return image;
      } catch (error) {
        await this.bestEffortDelete(objectKey, error);
        throw error;
      }
    });
  }

  async removeImage(ownerId: string, listingId: string, imageId: string) {
    return this.withListingLock(listingId, async (db) => {
      await this.assertOwnedDraft(db, ownerId, listingId);
      const image = await db.listingImage.findFirst({
        where: { id: imageId, listingId },
      });
      if (!image) throw new NotFoundException('Image not found');
      const content = await this.imageStorage!.get(image.objectKey);
      await this.imageStorage!.delete(image.objectKey);
      try {
        await db.listingImage.delete({ where: { id: image.id } });
        await db.listingImage.updateMany({
          where: { listingId, position: { gt: image.position } },
          data: { position: { decrement: 1 } },
        });
      } catch (error) {
        await this.restoreObjects([{ key: image.objectKey, content }], error);
        throw error;
      }
    });
  }

  async reorderImage(
    ownerId: string,
    listingId: string,
    imageId: string,
    position: number,
  ) {
    return this.withListingLock(listingId, async (db) => {
      await this.assertOwnedDraft(db, ownerId, listingId);
      const images = await db.listingImage.findMany({
        where: { listingId },
        orderBy: { position: 'asc' },
      });
      const current = images.findIndex((image) => image.id === imageId);
      if (current < 0) throw new NotFoundException('Image not found');
      if (position < 0 || position >= images.length)
        throw new BadRequestException('Position is out of range');
      const [moved] = images.splice(current, 1);
      images.splice(position, 0, moved);
      await db.listingImage.updateMany({
        where: { listingId },
        data: { position: { decrement: images.length } },
      });
      for (const [index, image] of images.entries()) {
        await db.listingImage.update({
          where: { id: image.id },
          data: { position: index },
        });
      }
      return db.listingImage.findMany({
        where: { listingId },
        orderBy: { position: 'asc' },
        select: {
          id: true,
          originalName: true,
          contentType: true,
          sizeBytes: true,
          position: true,
          createdAt: true,
        },
      });
    });
  }

  private async withListingLock<T>(
    listingId: string,
    work: (db: PrismaService | Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`
        SELECT pg_advisory_xact_lock(hashtextextended(${listingId}, 0))
      `;
      return work(tx);
    });
  }

  private async restoreObjects(
    backups: Array<{ key: string; content: Buffer }>,
    original: unknown,
  ) {
    for (const backup of backups) {
      try {
        await this.imageStorage!.put(backup.key, backup.content);
      } catch (restoreError) {
        console.error(
          `Image compensation failed for ${backup.key}: ${String(restoreError)}`,
          { cause: original },
        );
      }
    }
  }

  private async bestEffortDelete(objectKey: string, original: unknown) {
    try {
      await this.imageStorage!.delete(objectKey);
    } catch (cleanupError) {
      console.error(
        `Image cleanup failed for ${objectKey}: ${String(cleanupError)}`,
        { cause: original },
      );
    }
  }

  private async assertOwnedDraft(
    db: PrismaService | Prisma.TransactionClient,
    ownerId: string,
    listingId: string,
  ) {
    const listing = await db.listing.findFirst({
      where: { id: listingId, ownerId, status: ListingStatus.DRAFT },
      select: { id: true },
    });
    if (!listing) throw new NotFoundException('Listing not found');
  }
}
