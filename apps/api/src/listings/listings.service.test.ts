import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ListingsService } from './listings.service.js';

describe('ListingsService ownership', () => {
  const listing = { id: 'l1', ownerId: 'owner-a', status: 'DRAFT' };
  const prisma = {
    listing: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  } as never;
  const service = new ListingsService(prisma);

  beforeEach(() => vi.clearAllMocks());

  it('lists only the authenticated owner drafts', async () => {
    await service.listMine('owner-a');
    expect((prisma as any).listing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ownerId: 'owner-a', status: 'DRAFT' },
      }),
    );
  });

  it('does not read another owner listing', async () => {
    (prisma as any).listing.findUnique.mockResolvedValue({
      ...listing,
      ownerId: 'owner-b',
    });
    await expect(service.getMine('owner-a', 'l1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('updates only the owner draft with an atomic where clause', async () => {
    (prisma as any).listing.updateMany.mockResolvedValue({ count: 1 });
    (prisma as any).listing.findUnique.mockResolvedValue(listing);
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
    (prisma as any).listing.deleteMany.mockResolvedValue({ count: 1 });
    await service.remove('owner-a', 'l1');
    expect((prisma as any).listing.deleteMany).toHaveBeenCalledWith({
      where: { id: 'l1', ownerId: 'owner-a', status: 'DRAFT' },
    });
  });

  it('translates an atomic delete miss to NotFoundException', async () => {
    (prisma as any).listing.deleteMany.mockResolvedValue({ count: 0 });
    await expect(service.remove('owner-a', 'l1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
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
