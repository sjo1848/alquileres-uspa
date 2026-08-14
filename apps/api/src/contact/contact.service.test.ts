import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContactService } from './contact.service.js';

describe('direct contact', () => {
  const prisma = {
    listing: { findFirst: vi.fn() },
    contactEvent: { create: vi.fn() },
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
      },
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
