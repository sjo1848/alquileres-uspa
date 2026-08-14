import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ListingsService } from './listings.service.js';

describe('ListingsService ownership', () => {
  const listing = { id: 'l1', ownerId: 'owner-a', status: 'DRAFT' };
  const prisma = {
    listing: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    listingImage: { findMany: vi.fn() },
    $transaction: vi.fn(),
    $queryRaw: vi.fn(),
  } as any;
  const storage = { get: vi.fn(), delete: vi.fn(), put: vi.fn() };
  const service = new ListingsService(prisma, storage);

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.$transaction.mockImplementation(
      async (callback: (tx: any) => unknown) => callback(prisma),
    );
    prisma.$queryRaw.mockResolvedValue(undefined);
  });

  it('lists only the authenticated owner drafts', async () => {
    await service.listMine('owner-a');
    expect((prisma as any).listing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ownerId: 'owner-a', status: 'DRAFT' },
      }),
    );
  });

  it('queries only the authenticated owner draft and translates a miss', async () => {
    (prisma as any).listing.findFirst.mockResolvedValue(null);
    await expect(service.getMine('owner-a', 'l1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect((prisma as any).listing.findFirst).toHaveBeenCalledWith({
      where: { id: 'l1', ownerId: 'owner-a', status: 'DRAFT' },
    });
  });

  it('updates only the owner draft with an atomic where clause', async () => {
    (prisma as any).listing.updateMany.mockResolvedValue({ count: 1 });
    (prisma as any).listing.findFirst.mockResolvedValue(listing);
    await service.update('owner-a', 'l1', { title: 'x' });
    expect((prisma as any).listing.updateMany).toHaveBeenCalledWith({
      where: { id: 'l1', ownerId: 'owner-a', status: 'DRAFT' },
      data: { title: 'x' },
    });
  });

  it('translates an atomic update miss to NotFoundException', async () => {
    (prisma as any).listing.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      service.update('owner-a', 'l1', { title: 'x' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deletes only the owner draft with an atomic where clause', async () => {
    (prisma as any).listing.findFirst.mockResolvedValue(listing);
    (prisma as any).listingImage.findMany.mockResolvedValue([]);
    (prisma as any).listing.deleteMany.mockResolvedValue({ count: 1 });
    await service.remove('owner-a', 'l1');
    expect((prisma as any).listing.deleteMany).toHaveBeenCalledWith({
      where: { id: 'l1', ownerId: 'owner-a', status: 'DRAFT' },
    });
  });

  it('translates an atomic delete miss to NotFoundException', async () => {
    (prisma as any).listing.findFirst.mockResolvedValue(null);
    await expect(service.remove('owner-a', 'l1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('deletes all listing objects before deleting the draft metadata', async () => {
    const images = [
      { objectKey: 'listings/l1/a.png' },
      { objectKey: 'listings/l1/b.png' },
    ];
    (prisma as any).listing.findFirst.mockResolvedValue(listing);
    (prisma as any).listingImage.findMany.mockResolvedValue(images);
    storage.get.mockResolvedValue(Buffer.from('image'));
    storage.delete.mockResolvedValue(undefined);
    (prisma as any).listing.deleteMany.mockResolvedValue({ count: 1 });

    await service.remove('owner-a', 'l1');

    expect(storage.delete).toHaveBeenCalledWith('listings/l1/a.png');
    expect(storage.delete).toHaveBeenCalledWith('listings/l1/b.png');
    expect((prisma as any).listing.deleteMany).toHaveBeenCalled();
  });

  it('preserves a storage get failure and does not delete listing metadata', async () => {
    const getError = new Error('object read failed');
    (prisma as any).listing.findFirst.mockResolvedValue(listing);
    (prisma as any).listingImage.findMany.mockResolvedValue([
      { objectKey: 'listings/l1/a.png' },
    ]);
    storage.get.mockRejectedValue(getError);

    await expect(service.remove('owner-a', 'l1')).rejects.toBe(getError);
    expect(storage.delete).not.toHaveBeenCalled();
    expect((prisma as any).listing.deleteMany).not.toHaveBeenCalled();
  });

  it('compensates objects already deleted when listing cleanup partially fails', async () => {
    const deleteError = new Error('second object delete failed');
    const images = [
      { objectKey: 'listings/l1/a.png' },
      { objectKey: 'listings/l1/b.png' },
    ];
    (prisma as any).listing.findFirst.mockResolvedValue(listing);
    (prisma as any).listingImage.findMany.mockResolvedValue(images);
    storage.get.mockResolvedValue(Buffer.from('image'));
    storage.delete
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(deleteError);

    await expect(service.remove('owner-a', 'l1')).rejects.toBe(deleteError);
    expect(storage.put).toHaveBeenCalledWith(
      'listings/l1/a.png',
      Buffer.from('image'),
    );
    expect((prisma as any).listing.deleteMany).not.toHaveBeenCalled();
  });

  it('does not accept a final delete that no longer matches owner and draft status', async () => {
    (prisma as any).listing.findFirst.mockResolvedValue(listing);
    (prisma as any).listingImage.findMany.mockResolvedValue([]);
    (prisma as any).listing.deleteMany.mockResolvedValue({ count: 0 });
    await expect(service.remove('owner-a', 'l1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect((prisma as any).listing.deleteMany).toHaveBeenCalledWith({
      where: { id: 'l1', ownerId: 'owner-a', status: 'DRAFT' },
    });
  });

  it('derives ownerId from the authenticated identity on create', async () => {
    (prisma as any).listing.create.mockResolvedValue(listing);
    await service.create('owner-a', {
      title: 'x',
      description: '',
      location: 'Uspallata',
      pricePerNight: 100,
      maxGuests: 2,
    });
    expect((prisma as any).listing.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ ownerId: 'owner-a', status: 'DRAFT' }),
      }),
    );
  });
});
