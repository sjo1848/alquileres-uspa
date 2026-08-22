export type LeadState = 'UNREAD' | 'READ';

export type ContactEvent = {
  id: string;
  visitorName: string;
  visitorEmail: string;
  message: string;
  createdAt: string;
  state: LeadState;
  listingId: string;
  listing?: { id?: string; title?: string; location?: string } | null;
  listingTitle?: string;
};

export type ContactEventsResponse = {
  items: ContactEvent[];
  unreadCount: number;
  total?: number;
  nextCursor?: string | null;
};

export function normalizeContactEvents(result: ContactEventsResponse) {
  return {
    items: (result.items ?? []).map((item) => ({
      ...item,
      state: item.state === 'READ' ? ('READ' as const) : ('UNREAD' as const),
    })),
    unreadCount: Number.isFinite(result.unreadCount) ? result.unreadCount : 0,
  };
}

export function nextContactState(state: LeadState): LeadState {
  return state === 'UNREAD' ? 'READ' : 'UNREAD';
}

export function contactListingTitle(event: ContactEvent) {
  return event.listing?.title || event.listingTitle || 'Publicación sin título';
}

export function formatContactDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : date.toLocaleString();
}
