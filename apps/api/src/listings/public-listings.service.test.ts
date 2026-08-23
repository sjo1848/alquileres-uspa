import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ListingsService } from './listings.service.js';

describe('public listings catalog', () => {
  const prisma = {
    listing: { findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn() },
    listingImage: { findFirst: vi.fn() },
  } as any;
  const service = new ListingsService(prisma, {} as any);
  const published = {
    id: 'public-1',
    title: 'Cabaña',
    description: 'Descripción',
    location: 'Uspallata',
    priceAmount: 100,
    pricePeriod: 'WEEK',
    rentalDuration: 'MONTHS',
    maxOccupants: 4,
    currency: 'ARS',
    domainDataStatus: 'COMPLETE',
    availabilityStatus: 'AVAILABLE',
    lastConfirmedAt: new Date(),
    freshnessStatus: 'FRESH',
    images: [
      { id: 'image-1', contentType: 'image/jpeg', sizeBytes: 12, position: 0 },
    ],
  };

  beforeEach(() => vi.clearAllMocks());

  it('enumerates only approved and published listings with deterministic pagination', async () => {
    prisma.listing.findMany.mockResolvedValue([published]);
    prisma.listing.count.mockResolvedValue(1);
    const result = await service.listPublic({
      location: 'usp',
      page: 2,
      pageSize: 10,
    });

    expect(prisma.listing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'APPROVED',
          publicationStatus: 'PUBLISHED',
        }),
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: 10,
        take: 10,
      }),
    );
    expect(result).toEqual({
      items: [published],
      page: 2,
      pageSize: 10,
      totalItems: 1,
      totalPages: 1,
    });
  });

  it('applies validated public filters and rejects an inverted price range', async () => {
    prisma.listing.findMany.mockResolvedValue([]);
    prisma.listing.count.mockResolvedValue(0);
    await service.listPublic({
      minPriceAmount: 50,
      maxPriceAmount: 200,
      maxOccupants: 3,
      pricePeriod: 'WEEK',
      currency: 'ARS',
      page: 1,
      pageSize: 20,
    });
    expect(prisma.listing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          priceAmount: { gte: 50, lte: 200 },
          maxOccupants: { gte: 3 },
          pricePeriod: 'WEEK',
          currency: 'ARS',
        }),
      }),
    );
    await expect(
      service.listPublic({ minPriceAmount: 201, maxPriceAmount: 200 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns a published detail without internal fields', async () => {
    prisma.listing.findFirst.mockResolvedValue(published);
    const result = await service.getPublic('public-1');
    expect(prisma.listing.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'public-1',
          status: 'APPROVED',
          publicationStatus: 'PUBLISHED',
        },
      }),
    );
    expect(result).not.toHaveProperty('ownerId');
    expect(result).not.toHaveProperty('status');
    expect(result).not.toHaveProperty('publicationStatus');
    expect(result.images[0]).not.toHaveProperty('objectKey');
  });

  it('marks legacy rows as missing domain data without inventing values', async () => {
    prisma.listing.findFirst.mockResolvedValue({
      ...published,
      priceAmount: null,
      pricePeriod: null,
      rentalDuration: null,
      maxOccupants: null,
      currency: null,
    });
    await expect(service.getPublic('legacy-1')).resolves.toMatchObject({
      priceAmount: null,
      pricePeriod: null,
      rentalDuration: null,
      maxOccupants: null,
      currency: null,
      domainDataStatus: 'MISSING',
    });
  });

  it('keeps availability filtering opt-in and filters only available listings', async () => {
    prisma.listing.findMany.mockResolvedValue([]);
    prisma.listing.count.mockResolvedValue(0);

    await service.listPublic({ availableOnly: true });
    expect(prisma.listing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ availabilityStatus: 'AVAILABLE' }),
      }),
    );

    vi.clearAllMocks();
    prisma.listing.findMany.mockResolvedValue([]);
    prisma.listing.count.mockResolvedValue(0);
    await service.listPublic({});
    expect(prisma.listing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.not.objectContaining({ availabilityStatus: 'AVAILABLE' }),
      }),
    );
  });

  it('returns an explicit unconfirmed freshness state for null confirmation', async () => {
    prisma.listing.findFirst.mockResolvedValue({
      ...published,
      lastConfirmedAt: null,
    });

    await expect(service.getPublic('public-1')).resolves.toMatchObject({
      lastConfirmedAt: null,
      freshnessStatus: 'UNCONFIRMED',
    });
  });

  it('does not expose unpublished, rejected, or draft details', async () => {
    prisma.listing.findFirst.mockResolvedValue(null);
    await expect(service.getPublic('private-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.listing.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'private-1',
          status: 'APPROVED',
          publicationStatus: 'PUBLISHED',
        },
      }),
    );
  });

  it('serves bytes only for an image belonging to a published listing', async () => {
    const storage = { get: vi.fn().mockResolvedValue(Buffer.from('jpeg')) };
    const imageService = new ListingsService(prisma, storage as any);
    prisma.listingImage.findFirst.mockResolvedValue({
      objectKey: 'listings/public-1/image-1.jpg',
      contentType: 'image/jpeg',
      sizeBytes: 4,
    });
    const result = await imageService.getPublicImage('public-1', 'image-1');
    expect(prisma.listingImage.findFirst).toHaveBeenCalledWith({
      where: expect.objectContaining({
        id: 'image-1',
        listingId: 'public-1',
        listing: { status: 'APPROVED', publicationStatus: 'PUBLISHED' },
      }),
      select: { objectKey: true, contentType: true, sizeBytes: true },
    });
    expect(result.content).toEqual(Buffer.from('jpeg'));
    expect(result).not.toHaveProperty('ownerId');
    expect(result).not.toHaveProperty('objectKey');
  });
});
