import { describe, expect, it } from 'vitest';
import {
  availabilityLabel,
  availabilityQuery,
  formatConfirmationDate,
  freshnessMarker,
  freshnessLabel,
} from './availability-helpers';

describe('availability helpers', () => {
  it('uses clear public availability labels', () => {
    expect(availabilityLabel('AVAILABLE')).toBe('Disponible');
    expect(availabilityLabel('UNAVAILABLE')).toBe('No disponible');
    expect(availabilityLabel('AVAILABLE', 'STALE')).toBe(
      'Último registro: disponible',
    );
    expect(availabilityLabel('AVAILABLE', 'UNCONFIRMED')).toBe(
      'Disponibilidad no confirmada',
    );
  });

  it('keeps the opt-in availability query resettable', () => {
    expect(availabilityQuery(false)).toEqual({});
    expect(availabilityQuery(true)).toEqual({ availableOnly: 'true' });
  });

  it('distinguishes recent, stale and unconfirmed availability', () => {
    expect(freshnessLabel('FRESH', '2026-08-22T00:00:00.000Z')).toBe(
      'Confirmación reciente',
    );
    expect(freshnessLabel('STALE', '2026-01-01T00:00:00.000Z')).toBe(
      'Disponibilidad no confirmada recientemente',
    );
    expect(freshnessLabel('UNCONFIRMED', null)).toBe(
      'Disponibilidad aún no confirmada',
    );
  });

  it('does not render Invalid Date for missing or malformed confirmation', () => {
    expect(formatConfirmationDate(null)).toBe('Sin confirmación registrada');
    expect(formatConfirmationDate('not-a-date')).toBe(
      'Sin confirmación registrada',
    );
  });

  it('provides a non-color marker for each freshness state', () => {
    expect(freshnessMarker('FRESH')).toBe('✓');
    expect(freshnessMarker('STALE')).toBe('!');
    expect(freshnessMarker('UNCONFIRMED')).toBe('?');
  });
});
