import { describe, expect, it } from 'vitest';
import {
  contactListingTitle,
  nextContactState,
  normalizeContactEvents,
} from './contact-helpers';

const event = {
  id: 'contact-1',
  listingId: 'listing-1',
  visitorName: 'Ana',
  visitorEmail: 'ana@example.com',
  message: '¿Está disponible?',
  createdAt: '2026-08-21T12:00:00.000Z',
  state: 'UNREAD' as const,
};

describe('contact helpers', () => {
  it('normalizes the lead state and keeps the API unread count', () => {
    const result = normalizeContactEvents({
      items: [event, { ...event, id: 'contact-2', state: 'READ' }],
      unreadCount: 1,
    });

    expect(result.items.map((item) => item.state)).toEqual(['UNREAD', 'READ']);
    expect(result.unreadCount).toBe(1);
  });

  it('supports the only allowed reversible state transitions', () => {
    expect(nextContactState('UNREAD')).toBe('READ');
    expect(nextContactState('READ')).toBe('UNREAD');
  });

  it('prefers listing context returned by the API', () => {
    expect(
      contactListingTitle({ ...event, listing: { title: 'Cabaña del Sol' } }),
    ).toBe('Cabaña del Sol');
    expect(contactListingTitle(event)).toBe('Publicación sin título');
  });
});
