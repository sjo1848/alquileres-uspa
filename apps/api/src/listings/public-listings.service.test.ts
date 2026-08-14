import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ListingsService } from './listings.service.js';

describe('public listings catalog', () => {
  const prisma = {
    listing: { findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn() },
  } as any;
  const service = new ListingsService(prisma, {} as any);
  const published = {
    id: 'public-1',
    title: 'Cabaña',
    description: 'Descripción',
    location: 'Uspallata',
    pricePerNight: 100,
    maxGuests: 4,
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
      minPricePerNight: 50,
      maxPricePerNight: 200,
      maxGuests: 3,
      page: 1,
      pageSize: 20,
    });
    expect(prisma.listing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          pricePerNight: { gte: 50, lte: 200 },
          maxGuests: { gte: 3 },
        }),
      }),
    );
    await expect(
      service.listPublic({ minPricePerNight: 201, maxPricePerNight: 200 }),
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
});
