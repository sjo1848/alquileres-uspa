import { describe, expect, it } from 'vitest';
import {
  formatRentalPrice,
  hasRentalDomainData,
  rentalDurationLabel,
} from './rental-domain';

describe('Buscayata rental vocabulary', () => {
  it('formats a complete rental domain without tourist assumptions', () => {
    const listing = {
      priceAmount: 125000,
      pricePeriod: 'MONTH' as const,
      rentalDuration: 'MONTHS' as const,
      maxOccupants: 3,
      currency: 'ARS' as const,
    };

    expect(hasRentalDomainData(listing)).toBe(true);
    expect(formatRentalPrice(listing)).toContain('por mes');
    expect(formatRentalPrice(listing)).toContain('3 ocupantes');
    expect(rentalDurationLabel(listing.rentalDuration)).toBe('Por meses');
  });

  it('keeps legacy rows explicitly pending instead of deriving a period', () => {
    const legacy = {
      priceAmount: null,
      pricePeriod: null,
      rentalDuration: null,
      maxOccupants: null,
      currency: null,
    };

    expect(hasRentalDomainData(legacy)).toBe(false);
    expect(formatRentalPrice(legacy)).toBe('Datos de alquiler pendientes');
  });
});
