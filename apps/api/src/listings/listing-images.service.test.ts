import { ConflictException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ListingsService } from './listings.service.js';

const image = {
  id: 'image-a',
  listingId: 'listing-a',
  objectKey: 'listings/listing-a/image-a.png',
  originalName: 'cabin.png',
  contentType: 'image/png',
  sizeBytes: 24,
  position: 0,
  createdAt: new Date(),
};
const file = {
  originalname: 'cabin.png',
  mimetype: 'image/png',
  size: 24,
  buffer: Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    Buffer.alloc(4),
    Buffer.from('IHDR'),
    Buffer.alloc(8),
  ]),
} as Express.Multer.File;

describe('ListingsService images', () => {
  const prisma = {
    listing: { findFirst: vi.fn() },
    listingImage: {
      count: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
    $queryRaw: vi.fn(),
  } as any;
  const storage = { put: vi.fn(), get: vi.fn(), delete: vi.fn() };
  const service = new ListingsService(prisma, storage);

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.listing.findFirst.mockResolvedValue({ id: 'listing-a' });
    prisma.$transaction.mockImplementation(
      async (callback: (tx: any) => unknown) => callback(prisma),
    );
    prisma.$queryRaw.mockResolvedValue(undefined);
  });

  it('never lists images without the authenticated owner in the listing check', async () => {
    prisma.listingImage.findMany.mockResolvedValue([]);
    await service.listImages('owner-a', 'listing-a');
    expect(prisma.listing.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'listing-a',
        ownerId: 'owner-a',
        status: { in: ['DRAFT', 'REJECTED'] },
      },
      select: { id: true },
    });
  });

  it('hides another owner listing as not found', async () => {
    prisma.listing.findFirst.mockResolvedValue(null);
    await expect(
      service.listImages('owner-b', 'listing-a'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.listingImage.findMany).not.toHaveBeenCalled();
  });

  it('enforces the configurable image count limit', async () => {
    process.env.LISTING_IMAGE_MAX_COUNT = '1';
    prisma.listingImage.count.mockResolvedValue(1);
    await expect(
      service.addImage('owner-a', 'listing-a', file),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(storage.put).not.toHaveBeenCalled();
    delete process.env.LISTING_IMAGE_MAX_COUNT;
  });

  it('stores bytes through the adapter and only returns metadata', async () => {
    prisma.listingImage.count.mockResolvedValue(0);
    prisma.listingImage.create.mockResolvedValue({
      id: image.id,
      originalName: image.originalName,
      contentType: image.contentType,
      sizeBytes: image.sizeBytes,
      position: image.position,
      createdAt: image.createdAt,
    });
    const result = await service.addImage('owner-a', 'listing-a', file);
    expect(storage.put).toHaveBeenCalledOnce();
    expect(prisma.listingImage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          listingId: 'listing-a',
          objectKey: expect.stringMatching(/^listings\/listing-a\//),
        }),
      }),
    );
    expect(result).not.toHaveProperty('objectKey');
    expect(storage.put).toHaveBeenCalledWith(
      expect.stringMatching(/^listings\/listing-a\//),
      file.buffer,
    );
  });

  it('serializes mutations through a PostgreSQL transaction advisory lock', async () => {
    prisma.listingImage.findMany.mockResolvedValue([]);
    await service
      .reorderImage('owner-a', 'listing-a', image.id, 0)
      .catch(() => undefined);
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.$queryRaw).toHaveBeenCalled();
  });

  it('reorders images and writes contiguous positions', async () => {
    const second = {
      ...image,
      id: 'image-b',
      position: 1,
      originalName: 'lake.png',
    };
    prisma.listingImage.findMany
      .mockResolvedValueOnce([image, second])
      .mockResolvedValueOnce([second, image]);
    await service.reorderImage('owner-a', 'listing-a', image.id, 1);
    expect(prisma.listingImage.updateMany).toHaveBeenCalledWith({
      where: { listingId: 'listing-a' },
      data: { position: { decrement: 2 } },
    });
    expect(prisma.listingImage.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'image-b' },
      data: { position: 0 },
    });
    expect(prisma.listingImage.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'image-a' },
      data: { position: 1 },
    });
  });

  it('does not delete an image belonging to another listing', async () => {
    prisma.listingImage.findFirst.mockResolvedValue(null);
    await expect(
      service.removeImage('owner-a', 'listing-a', 'image-b'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.listingImage.delete).not.toHaveBeenCalled();
  });

  it('re-reads the image inside the listing lock and uses its current position', async () => {
    prisma.listingImage.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ ...image, position: 2 });
    await expect(
      service.removeImage('owner-a', 'listing-a', image.id),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(storage.delete).not.toHaveBeenCalled();
    prisma.listingImage.findFirst.mockResolvedValue({ ...image, position: 2 });
    storage.get.mockResolvedValue(Buffer.from('image'));
    prisma.listingImage.delete.mockResolvedValue(image);
    await service.removeImage('owner-a', 'listing-a', image.id);
    expect(prisma.listingImage.updateMany).toHaveBeenCalledWith({
      where: { listingId: 'listing-a', position: { gt: 2 } },
      data: { position: { decrement: 1 } },
    });
  });

  it('preserves a put error and attempts cleanup after a partial write', async () => {
    const putError = new Error('put failed');
    storage.put.mockRejectedValueOnce(putError);
    storage.delete.mockRejectedValueOnce(new Error('cleanup failed'));
    prisma.listingImage.count.mockResolvedValue(0);
    await expect(service.addImage('owner-a', 'listing-a', file)).rejects.toBe(
      putError,
    );
    expect(storage.delete).toHaveBeenCalledOnce();
    expect(prisma.listingImage.create).not.toHaveBeenCalled();
  });

  it('preserves a metadata error when cleanup also fails', async () => {
    const metadataError = new Error('metadata failed');
    prisma.listingImage.count.mockResolvedValue(0);
    prisma.listingImage.create.mockRejectedValue(metadataError);
    storage.delete.mockRejectedValue(new Error('cleanup failed'));
    await expect(service.addImage('owner-a', 'listing-a', file)).rejects.toBe(
      metadataError,
    );
  });

  it('compensates storage when remove metadata fails', async () => {
    const metadataError = new Error('delete metadata failed');
    prisma.listingImage.findFirst.mockResolvedValue(image);
    storage.get.mockResolvedValue(file.buffer);
    storage.delete.mockResolvedValue(undefined);
    prisma.listingImage.delete.mockRejectedValue(metadataError);
    await expect(
      service.removeImage('owner-a', 'listing-a', image.id),
    ).rejects.toBe(metadataError);
    expect(storage.put).toHaveBeenCalledWith(image.objectKey, file.buffer);
  });

  it('preserves the metadata error when restore also fails', async () => {
    const metadataError = new Error('delete metadata failed');
    prisma.listingImage.findFirst.mockResolvedValue(image);
    storage.get.mockResolvedValue(file.buffer);
    storage.delete.mockResolvedValue(undefined);
    storage.put.mockRejectedValue(new Error('restore failed'));
    prisma.listingImage.delete.mockRejectedValue(metadataError);

    await expect(
      service.removeImage('owner-a', 'listing-a', image.id),
    ).rejects.toBe(metadataError);
  });
});
