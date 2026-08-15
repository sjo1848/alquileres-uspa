import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ListingsService } from './listings.service.js';

describe('ListingsService ownership', () => {
  const admin = { id: 'admin-1', email: 'admin@test', role: 'ADMIN' as const };
  const listing = { id: 'l1', ownerId: 'owner-a', status: 'DRAFT' };
  const prisma = {
    listing: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      findUnique: vi.fn(),
    },
    user: { findMany: vi.fn() },
    listingImage: { findMany: vi.fn() },
    $transaction: vi.fn(),
    $queryRaw: vi.fn(),
  } as any;
  const storage = { get: vi.fn(), delete: vi.fn(), put: vi.fn() };
  const audit = { record: vi.fn() } as any;
  const service = new ListingsService(prisma, storage, audit);

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.$transaction.mockImplementation(
      async (callback: (tx: any) => unknown) => callback(prisma),
    );
    prisma.$queryRaw.mockResolvedValue(undefined);
  });

  it('lists only the authenticated owner listings', async () => {
    await service.listMine('owner-a');
    expect((prisma as any).listing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ownerId: 'owner-a' },
      }),
    );
  });

  it('lists only safe OWNER directory fields for admins', async () => {
    prisma.user.findMany.mockResolvedValue([
      { id: 'owner-a', email: 'owner@test', role: 'OWNER' },
    ]);
    await expect(service.listOwners(admin)).resolves.toEqual([
      { id: 'owner-a', email: 'owner@test', role: 'OWNER' },
    ]);
    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: { role: 'OWNER' },
      orderBy: { email: 'asc' },
      select: { id: true, email: true, role: true },
    });
  });

  it('lists review items with safe owner and image metadata only', async () => {
    prisma.listing.findMany.mockResolvedValue([]);

    await service.listForReview();

    expect(prisma.listing.findMany).toHaveBeenCalledWith({
      where: { status: 'SUBMITTED' },
      orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
      select: expect.objectContaining({
        owner: { select: { id: true, email: true, role: true } },
        images: {
          orderBy: [{ position: 'asc' }, { id: 'asc' }],
          select: {
            id: true,
            originalName: true,
            contentType: true,
            sizeBytes: true,
            position: true,
          },
        },
      }),
    });
    const selection = prisma.listing.findMany.mock.calls[0][0].select;
    expect(selection.owner.select).not.toHaveProperty('passwordHash');
    expect(selection.images.select).not.toHaveProperty('objectKey');
  });

  it('rejects the owner directory for non-admins', async () => {
    expect(() =>
      service.listOwners({ ...admin, role: 'OWNER' as const }),
    ).toThrow(ForbiddenException);
  });

  it('queries only the authenticated owner listing and translates a miss', async () => {
    (prisma as any).listing.findFirst.mockResolvedValue(null);
    await expect(service.getMine('owner-a', 'l1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect((prisma as any).listing.findFirst).toHaveBeenCalledWith({
      where: { id: 'l1', ownerId: 'owner-a' },
    });
  });

  it('updates only the owner draft with an atomic where clause', async () => {
    (prisma as any).listing.updateMany.mockResolvedValue({ count: 1 });
    (prisma as any).listing.findFirst.mockResolvedValue(listing);
    await service.update('owner-a', 'l1', { title: 'x' });
    expect((prisma as any).listing.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'l1',
        ownerId: 'owner-a',
        status: { in: ['DRAFT', 'REJECTED'] },
      },
      data: { title: 'x' },
    });
  });

  it('translates an atomic update miss to NotFoundException', async () => {
    (prisma as any).listing.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      service.update('owner-a', 'l1', { title: 'x' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates availability only for the authenticated owner', async () => {
    (prisma as any).listing.updateMany.mockResolvedValue({ count: 1 });
    (prisma as any).listing.findFirst.mockResolvedValue({
      ...listing,
      availabilityStatus: 'UNAVAILABLE',
    });
    await service.updateAvailability('owner-a', 'l1', {
      availabilityStatus: 'UNAVAILABLE' as any,
    });
    expect((prisma as any).listing.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'l1', ownerId: 'owner-a' },
        data: expect.objectContaining({ availabilityStatus: 'UNAVAILABLE' }),
      }),
    );
  });

  it('reconfirms only the authenticated owner listing', async () => {
    (prisma as any).listing.updateMany.mockResolvedValue({ count: 1 });
    (prisma as any).listing.findFirst.mockResolvedValue(listing);
    await service.reconfirm('owner-a', 'l1');
    expect((prisma as any).listing.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'l1', ownerId: 'owner-a' } }),
    );
  });

  it('deletes only the owner draft with an atomic where clause', async () => {
    (prisma as any).listing.findFirst.mockResolvedValue(listing);
    (prisma as any).listingImage.findMany.mockResolvedValue([]);
    (prisma as any).listing.deleteMany.mockResolvedValue({ count: 1 });
    await service.remove('owner-a', 'l1');
    expect((prisma as any).listing.deleteMany).toHaveBeenCalledWith({
      where: {
        id: 'l1',
        ownerId: 'owner-a',
        status: { in: ['DRAFT', 'REJECTED'] },
      },
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
      where: {
        id: 'l1',
        ownerId: 'owner-a',
        status: { in: ['DRAFT', 'REJECTED'] },
      },
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

  it('submits only the authenticated owner draft or rejected listing', async () => {
    (prisma as any).listing.findFirst.mockResolvedValue({ status: 'REJECTED' });
    (prisma as any).listing.updateMany.mockResolvedValue({ count: 1 });
    await service.submit('owner-a', 'l1');
    expect((prisma as any).listing.updateMany).toHaveBeenCalledWith({
      where: { id: 'l1', ownerId: 'owner-a', status: 'REJECTED' },
      data: { status: 'SUBMITTED', rejectionReason: null },
    });
  });

  it('rejects publishing until an admin-approved listing is selected atomically', async () => {
    (prisma as any).listing.findUnique.mockResolvedValue({
      status: 'APPROVED',
      publicationStatus: 'UNPUBLISHED',
      owner: { role: 'OWNER' },
    });
    (prisma as any).listing.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.publish(admin, 'l1')).rejects.toThrow(
      'approved unpublished',
    );
    expect((prisma as any).listing.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'l1',
          status: 'APPROVED',
          publicationStatus: 'UNPUBLISHED',
        },
      }),
    );
  });

  it('requires a submitted listing for admin rejection', async () => {
    (prisma as any).listing.findUnique.mockResolvedValue({
      status: 'APPROVED',
      rejectionReason: null,
      owner: { role: 'OWNER' },
    });
    (prisma as any).listing.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      service.reject(admin, 'l1', 'Falta información'),
    ).rejects.toThrow('awaiting review');
  });

  it('returns submitted listing unchanged when submit is repeated', async () => {
    (prisma as any).listing.findFirst.mockResolvedValue({
      status: 'SUBMITTED',
    });
    const current = { id: 'l1', status: 'SUBMITTED' };
    (prisma as any).listing.findUnique.mockResolvedValue(current);
    await expect(service.submit('owner-a', 'l1')).resolves.toBe(current);
    expect((prisma as any).listing.updateMany).not.toHaveBeenCalled();
  });

  it('makes approve, publish, and same-reason reject idempotent', async () => {
    const current = { id: 'l1', owner: { id: 'owner-a', role: 'OWNER' } };
    (prisma as any).listing.findFirst.mockResolvedValue(current);
    (prisma as any).listing.findUnique
      .mockResolvedValueOnce({ status: 'APPROVED', owner: { role: 'OWNER' } })
      .mockResolvedValueOnce(current)
      .mockResolvedValueOnce({
        status: 'APPROVED',
        publicationStatus: 'PUBLISHED',
        owner: { role: 'OWNER' },
      })
      .mockResolvedValueOnce(current)
      .mockResolvedValueOnce({
        status: 'REJECTED',
        rejectionReason: 'Falta información',
        owner: { role: 'OWNER' },
      })
      .mockResolvedValue(current);
    (prisma as any).listing.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.approve(admin, 'l1')).resolves.toBe(current);
    await expect(service.publish(admin, 'l1')).resolves.toBe(current);
    await expect(
      service.reject(admin, 'l1', 'Falta información'),
    ).resolves.toBe(current);
    expect((prisma as any).listing.updateMany).not.toHaveBeenCalled();
    expect((prisma as any).listing.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          owner: expect.anything(),
          images: expect.anything(),
        }),
      }),
    );
  });

  it('rejects a whitespace-only rejection reason', async () => {
    await expect(service.reject(admin, 'l1', '   \n\t')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rolls back the review mutation when its audit fails', async () => {
    const auditError = new Error('audit failed');
    audit.record.mockRejectedValueOnce(auditError);
    prisma.listing.findUnique
      .mockResolvedValueOnce({
        status: 'SUBMITTED',
        ownerId: 'owner-a',
        owner: { role: 'OWNER' },
      })
      .mockResolvedValueOnce({
        id: 'l1',
        ownerId: 'owner-a',
        status: 'APPROVED',
      });
    prisma.listing.updateMany.mockResolvedValue({ count: 1 });

    await expect(service.approve(admin, 'l1')).rejects.toBe(auditError);
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});
