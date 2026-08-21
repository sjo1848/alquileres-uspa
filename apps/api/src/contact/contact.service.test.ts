import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContactService } from './contact.service.js';

describe('direct contact', () => {
  const prisma = {
    listing: { findFirst: vi.fn() },
    contactEvent: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
    },
  } as any;
  const service = new ContactService(prisma);
  const input = {
    visitorName: ' Ana ',
    visitorEmail: ' ANA@EXAMPLE.COM ',
    message: ' Hola ',
  };
  beforeEach(() => vi.clearAllMocks());
  it('associates to the public listing owner resolved server-side', async () => {
    prisma.listing.findFirst.mockResolvedValue({
      id: 'listing-1',
      ownerId: 'owner-1',
    });
    expect(await service.create('listing-1', input)).toEqual({
      status: 'RECEIVED',
    });
    expect(prisma.contactEvent.create).toHaveBeenCalledWith({
      data: {
        listingId: 'listing-1',
        ownerId: 'owner-1',
        visitorName: 'Ana',
        visitorEmail: 'ana@example.com',
        message: 'Hola',
        state: 'UNREAD',
      },
    });
  });

  it('lists only the owner events and counts unread events', async () => {
    prisma.contactEvent.findMany.mockResolvedValue([{ id: 'event-1' }]);
    prisma.contactEvent.count.mockResolvedValue(1);

    await expect(service.listMine('owner-1')).resolves.toEqual({
      items: [{ id: 'event-1' }],
      unreadCount: 1,
    });
    expect(prisma.contactEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ownerId: 'owner-1', listing: { ownerId: 'owner-1' } },
      }),
    );
    expect(prisma.contactEvent.count).toHaveBeenCalledWith({
      where: {
        ownerId: 'owner-1',
        listing: { ownerId: 'owner-1' },
        state: 'UNREAD',
      },
    });
  });

  it('does not expose another owner event and updates state only in owner scope', async () => {
    prisma.contactEvent.findFirst.mockResolvedValue(null);
    await expect(service.getMine('owner-1', 'event-2')).rejects.toBeInstanceOf(
      NotFoundException,
    );

    prisma.contactEvent.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      service.updateState('owner-1', 'event-2', 'READ'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.contactEvent.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'event-2',
        ownerId: 'owner-1',
        listing: { ownerId: 'owner-1' },
      },
      data: { state: 'READ' },
    });
  });

  it('restores a lead to unread through the same owner-scoped transition', async () => {
    prisma.contactEvent.updateMany.mockResolvedValue({ count: 1 });
    prisma.contactEvent.findFirst.mockResolvedValue({
      id: 'event-1',
      state: 'UNREAD',
    });

    await expect(
      service.updateState('owner-1', 'event-1', 'UNREAD'),
    ).resolves.toMatchObject({ id: 'event-1', state: 'UNREAD' });
    expect(prisma.contactEvent.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'event-1',
        ownerId: 'owner-1',
        listing: { ownerId: 'owner-1' },
      },
      data: { state: 'UNREAD' },
    });
  });
  it('does not create events for non-public listings', async () => {
    prisma.listing.findFirst.mockResolvedValue(null);
    await expect(service.create('draft-1', input)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.contactEvent.create).not.toHaveBeenCalled();
  });
});
