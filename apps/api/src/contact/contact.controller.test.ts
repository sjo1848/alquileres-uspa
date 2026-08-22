import { describe, expect, it, vi } from 'vitest';
import { OwnerContactController } from './contact.controller.js';

describe('OwnerContactController', () => {
  const contacts = {
    listMine: vi.fn(),
    getMine: vi.fn(),
    updateState: vi.fn(),
  };
  const controller = new OwnerContactController(contacts);
  const request = { user: { id: 'owner-1' } } as any;

  it('passes authenticated owner identity to the list and detail operations', async () => {
    contacts.listMine.mockResolvedValue({ items: [], unreadCount: 0 });
    contacts.getMine.mockResolvedValue({ id: 'event-1' });

    await controller.list(request);
    await controller.get(request, 'event-1');

    expect(contacts.listMine).toHaveBeenCalledWith('owner-1');
    expect(contacts.getMine).toHaveBeenCalledWith('owner-1', 'event-1');
  });

  it('does not accept an owner id from the request body for state changes', async () => {
    contacts.updateState.mockResolvedValue({ id: 'event-1', state: 'READ' });

    await controller.updateState(request, 'event-1', {
      state: 'READ',
      ownerId: 'attacker-controlled',
    } as any);

    expect(contacts.updateState).toHaveBeenCalledWith(
      'owner-1',
      'event-1',
      'READ',
    );
    expect(contacts.updateState).not.toHaveBeenCalledWith(
      'attacker-controlled',
      expect.anything(),
      expect.anything(),
    );
  });
});
