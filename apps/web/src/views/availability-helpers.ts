export type AvailabilityStatus = 'AVAILABLE' | 'UNAVAILABLE';
export type FreshnessStatus = 'FRESH' | 'STALE' | 'UNCONFIRMED';

export function availabilityLabel(
  status: AvailabilityStatus,
  freshness: FreshnessStatus = 'FRESH',
) {
  if (freshness === 'UNCONFIRMED') return 'Disponibilidad no confirmada';
  if (freshness === 'STALE') {
    return status === 'AVAILABLE'
      ? 'Último registro: disponible'
      : 'Último registro: no disponible';
  }
  return status === 'AVAILABLE' ? 'Disponible' : 'No disponible';
}

export function freshnessLabel(
  status: FreshnessStatus | undefined,
  lastConfirmedAt: string | null | undefined,
) {
  if (
    status === 'UNCONFIRMED' ||
    !lastConfirmedAt ||
    Number.isNaN(new Date(lastConfirmedAt).getTime())
  ) {
    return 'Disponibilidad aún no confirmada';
  }
  return status === 'STALE'
    ? 'Disponibilidad no confirmada recientemente'
    : 'Confirmación reciente';
}

export function freshnessMarker(status: FreshnessStatus | undefined) {
  return status === 'STALE' ? '!' : status === 'UNCONFIRMED' ? '?' : '✓';
}

export function formatConfirmationDate(
  lastConfirmedAt: string | null | undefined,
) {
  if (!lastConfirmedAt) return 'Sin confirmación registrada';
  const date = new Date(lastConfirmedAt);
  return Number.isNaN(date.getTime())
    ? 'Sin confirmación registrada'
    : date.toLocaleDateString('es-AR');
}

export function availabilityQuery(enabled: boolean) {
  return enabled ? { availableOnly: 'true' } : {};
}
