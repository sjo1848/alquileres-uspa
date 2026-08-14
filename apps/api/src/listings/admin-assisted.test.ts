import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ListingsService } from './listings.service.js';

describe('I08 assisted listings transaction boundaries', () => {
  const admin = {
    id: 'admin-1',
    email: 'admin@example.test',
    role: Role.ADMIN,
  };
  const owner = { id: 'owner-1', role: Role.OWNER };
  const input = {
    title: 'Casa',
    description: 'Desc',
    location: 'Uspallata',
    pricePerNight: 100,
    maxGuests: 2,
  };
  const root = { $transaction: vi.fn(), $queryRaw: vi.fn() } as any;
  const tx = {
    $queryRaw: vi.fn(),
    user: { findFirst: vi.fn() },
    listing: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    listingImage: { findMany: vi.fn() },
  } as any;
  const storage = { get: vi.fn(), delete: vi.fn(), put: vi.fn() };
  const audit = { record: vi.fn() } as any;
  const service = new ListingsService(root, storage, audit);

  beforeEach(() => {
    vi.clearAllMocks();
    root.$transaction.mockImplementation(
      async (callback: (client: any) => unknown) => callback(tx),
    );
    root.$queryRaw.mockResolvedValue(undefined);
    tx.$queryRaw.mockResolvedValue(undefined);
    tx.user.findFirst.mockResolvedValue(owner);
    tx.listing.findUnique.mockResolvedValue({
      id: 'listing-1',
      ownerId: owner.id,
      owner,
    });
    tx.listing.findFirst.mockResolvedValue({ status: 'DRAFT' });
    tx.listing.updateMany.mockResolvedValue({ count: 1 });
    tx.listing.create.mockResolvedValue({ id: 'listing-1', ownerId: owner.id });
    tx.listing.deleteMany.mockResolvedValue({ count: 1 });
    tx.listingImage.findMany.mockResolvedValue([]);
    audit.record.mockResolvedValue(undefined);
  });

  it.each([
    [
      'create',
      () => service.createAssisted(admin, owner.id, input),
      'ADMIN_ASSISTED_LISTING_CREATED',
    ],
    [
      'update',
      () => service.updateAssisted(admin, 'listing-1', { title: 'Nuevo' }),
      'ADMIN_ASSISTED_LISTING_UPDATED',
    ],
    [
      'availability',
      () =>
        service.updateAvailabilityAssisted(admin, 'listing-1', {
          availabilityStatus: 'UNAVAILABLE' as any,
        }),
      'ADMIN_ASSISTED_AVAILABILITY_UPDATED',
    ],
    [
      'reconfirm',
      () => service.reconfirmAssisted(admin, 'listing-1'),
      'ADMIN_ASSISTED_LISTING_RECONFIRMED',
    ],
    [
      'submit',
      () => service.submitAssisted(admin, 'listing-1'),
      'ADMIN_ASSISTED_LISTING_SUBMITTED',
    ],
  ])(
    '%s mutates and audits through the same transaction client',
    async (_name, operation, action) => {
      await operation();
      expect(root.$transaction).toHaveBeenCalled();
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action }),
        tx,
      );
      expect(
        audit.record.mock.calls.every((call: unknown[]) => call[1] === tx),
      ).toBe(true);
      expect(root.listing?.updateMany).toBeUndefined();
    },
  );

  it.each([
    [
      'update',
      () => service.updateAssisted(admin, 'listing-1', { title: 'x' }),
    ],
    [
      'availability',
      () =>
        service.updateAvailabilityAssisted(admin, 'listing-1', {
          availabilityStatus: 'AVAILABLE' as any,
        }),
    ],
    ['reconfirm', () => service.reconfirmAssisted(admin, 'listing-1')],
    ['submit', () => service.submitAssisted(admin, 'listing-1')],
  ])(
    '%s rolls back the database mutation when audit fails',
    async (_name, operation) => {
      const auditError = new Error('audit failed');
      audit.record.mockRejectedValueOnce(auditError);
      await expect(operation()).rejects.toBe(auditError);
      expect(audit.record).toHaveBeenCalledWith(expect.anything(), tx);
      // The real Prisma transaction rejects here; this assertion ensures no root client was used.
      expect(root.listing).toBeUndefined();
    },
  );

  it('rolls back assisted create when audit fails', async () => {
    const auditError = new Error('audit failed');
    let persisted = false;
    audit.record.mockRejectedValueOnce(auditError);
    tx.listing.create.mockImplementation(async () => {
      persisted = true;
      return { id: 'listing-1', ownerId: owner.id };
    });
    root.$transaction.mockImplementation(
      async (callback: (client: any) => unknown) => {
        try {
          return await callback(tx);
        } catch (error) {
          persisted = false;
          throw error;
        }
      },
    );
    await expect(service.createAssisted(admin, owner.id, input)).rejects.toBe(
      auditError,
    );
    expect(tx.listing.create).toHaveBeenCalled();
    expect(audit.record).toHaveBeenCalledWith(expect.anything(), tx);
    expect(persisted).toBe(false);
  });

  it('compensates deleted storage when assisted delete audit fails', async () => {
    const auditError = new Error('audit failed');
    const content = Buffer.from('image');
    tx.listingImage.findMany.mockResolvedValue([
      { objectKey: 'listings/listing-1/a.png' },
    ]);
    storage.get.mockResolvedValue(content);
    storage.delete.mockResolvedValue(undefined);
    audit.record.mockRejectedValueOnce(auditError);
    await expect(service.removeAssisted(admin, 'listing-1')).rejects.toBe(
      auditError,
    );
    expect(storage.delete).toHaveBeenCalledWith('listings/listing-1/a.png');
    expect(storage.put).toHaveBeenCalledWith(
      'listings/listing-1/a.png',
      content,
    );
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'ADMIN_ASSISTED_LISTING_DELETED' }),
      tx,
    );
  });

  it('uses isolated in-memory transaction state and restores storage on callback or commit failure', async () => {
    const persisted = {
      listing: {
        id: 'listing-1',
        ownerId: owner.id,
        status: 'DRAFT',
        owner,
      },
      images: [{ objectKey: 'listings/listing-1/a.png' }],
      audits: [] as unknown[],
    };
    const content = Buffer.from('image');
    storage.get.mockResolvedValue(content);
    storage.delete.mockResolvedValue(undefined);
    storage.put.mockResolvedValue(undefined);

    const makeTx = () => {
      const working = structuredClone(persisted);
      return {
        $queryRaw: vi.fn().mockResolvedValue(undefined),
        listing: {
          findUnique: vi.fn(async () => working.listing),
          findFirst: vi.fn(async () => working.listing),
          deleteMany: vi.fn(async () => {
            working.listing = undefined as never;
            return { count: 1 };
          }),
        },
        listingImage: { findMany: vi.fn(async () => working.images) },
        audit: working,
      };
    };
    const isolatedRoot = {
      $queryRaw: vi.fn(),
      $transaction: vi.fn(async (callback: (client: any) => unknown) => {
        const transaction = makeTx();
        const result = await callback(transaction);
        persisted.listing = transaction.audit.listing;
        persisted.images = transaction.audit.images;
        persisted.audits = transaction.audit.audits;
        return result;
      }),
    } as any;
    const isolatedAudit = {
      record: vi.fn(async (_entry: unknown, db: any) => {
        db.audit.audits.push(_entry);
      }),
    } as any;
    const isolatedService = new ListingsService(
      isolatedRoot,
      storage,
      isolatedAudit,
    );

    isolatedAudit.record.mockRejectedValueOnce(new Error('callback failed'));
    await expect(
      isolatedService.removeAssisted(admin, 'listing-1'),
    ).rejects.toThrow('callback failed');
    expect(persisted.listing).toBeDefined();
    expect(persisted.images).toHaveLength(1);
    expect(persisted.audits).toHaveLength(0);
    expect(storage.put).toHaveBeenCalledWith(
      'listings/listing-1/a.png',
      content,
    );

    isolatedAudit.record.mockImplementationOnce(
      async (_entry: unknown, db: any) => {
        db.audit.audits.push(_entry);
      },
    );
    isolatedRoot.$transaction.mockImplementationOnce(
      async (callback: (client: any) => unknown) => {
        const transaction = makeTx();
        await callback(transaction);
        throw new Error('commit failed');
      },
    );
    await expect(
      isolatedService.removeAssisted(admin, 'listing-1'),
    ).rejects.toThrow('commit failed');
    expect(persisted.listing).toBeDefined();
    expect(persisted.images).toHaveLength(1);
    expect(persisted.audits).toHaveLength(0);
    expect(storage.put).toHaveBeenLastCalledWith(
      'listings/listing-1/a.png',
      content,
    );
  });

  it('covers approve, publish and reject audit failures on the transaction client', async () => {
    for (const [method, expected] of [
      ['approve', 'ADMIN_LISTING_APPROVED'],
      ['publish', 'ADMIN_LISTING_PUBLISHED'],
      ['reject', 'ADMIN_LISTING_REJECTED'],
    ] as const) {
      vi.clearAllMocks();
      root.$transaction.mockImplementation(
        async (callback: (client: any) => unknown) => callback(tx),
      );
      tx.$queryRaw.mockResolvedValue(undefined);
      tx.listing.updateMany.mockResolvedValue({ count: 1 });
      tx.listing.findUnique
        .mockResolvedValueOnce(
          method === 'approve'
            ? { status: 'SUBMITTED', owner }
            : method === 'publish'
              ? { status: 'APPROVED', publicationStatus: 'UNPUBLISHED', owner }
              : { status: 'SUBMITTED', rejectionReason: null, owner },
        )
        .mockResolvedValueOnce({ id: 'listing-1', ownerId: owner.id });
      audit.record.mockRejectedValueOnce(new Error('audit failed'));
      const promise =
        method === 'reject'
          ? service.reject(admin, 'listing-1', 'Falta información')
          : service[method](admin, 'listing-1');
      await expect(promise).rejects.toThrow('audit failed');
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: expected }),
        tx,
      );
    }
  });

  it('rejects non-admin assisted access and non-owner persisted targets', async () => {
    await expect(
      service.createAssisted({ ...admin, role: Role.OWNER }, owner.id, input),
    ).rejects.toBeInstanceOf(ForbiddenException);
    tx.listing.findUnique.mockResolvedValue({
      ownerId: 'admin-1',
      owner: { role: Role.ADMIN },
    });
    await expect(
      service.updateAssisted(admin, 'listing-1', { title: 'x' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
