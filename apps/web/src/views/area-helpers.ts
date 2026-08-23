export type EditableListingStatus = 'DRAFT' | 'REJECTED';

export function canEditListing(status: string) {
  return status === 'DRAFT' || status === 'REJECTED';
}

export function editableListingPayload(input: {
  title?: string;
  description?: string;
  location?: string;
  priceAmount?: number;
  pricePeriod?: 'WEEK' | 'MONTH';
  rentalDuration?: 'WEEKS' | 'MONTHS' | 'PERMANENT' | 'FLEXIBLE';
  maxOccupants?: number;
  currency?: 'ARS' | 'USD';
}) {
  return {
    title: input.title,
    description: input.description,
    location: input.location,
    priceAmount: input.priceAmount,
    pricePeriod: input.pricePeriod,
    rentalDuration: input.rentalDuration,
    maxOccupants: input.maxOccupants,
    currency: input.currency,
  };
}

export function createSelectionGuard() {
  let version = 0;

  return {
    begin(id: string) {
      version += 1;
      return { id, version };
    },
    invalidate() {
      version += 1;
    },
    isCurrent(
      request: { id: string; version: number },
      selectedId: string | undefined,
    ) {
      return request.id === selectedId && request.version === version;
    },
  };
}

export function createMutationOwnership() {
  let token = 0;

  return {
    acquire() {
      token += 1;
      return token;
    },
    owns(candidate: number) {
      return candidate === token;
    },
  };
}
