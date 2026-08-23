export type Currency = 'ARS' | 'USD';
export type PricePeriod = 'WEEK' | 'MONTH';
export type RentalDuration = 'WEEKS' | 'MONTHS' | 'PERMANENT' | 'FLEXIBLE';

export type RentalFields = {
  priceAmount?: number | null;
  pricePeriod?: PricePeriod | null;
  rentalDuration?: RentalDuration | null;
  maxOccupants?: number | null;
  currency?: Currency | null;
};
type CompleteRentalFields = {
  priceAmount: number;
  pricePeriod: PricePeriod;
  rentalDuration: RentalDuration;
  maxOccupants: number;
  currency: Currency;
};

export function hasRentalDomainData(
  listing: RentalFields | null | undefined,
): listing is CompleteRentalFields {
  return Boolean(
    listing &&
      listing.priceAmount !== null &&
      listing.priceAmount !== undefined &&
      listing.pricePeriod &&
      listing.rentalDuration &&
      listing.maxOccupants !== null &&
      listing.maxOccupants !== undefined &&
      listing.currency,
  );
}

export function formatRentalPrice(listing: RentalFields) {
  if (!hasRentalDomainData(listing)) return 'Datos de alquiler pendientes';
  return `${new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: listing.currency,
    maximumFractionDigits: 0,
  }).format(listing.priceAmount)} por ${pricePeriodLabel(listing.pricePeriod)} · ${listing.maxOccupants} ocupantes`;
}

export function pricePeriodLabel(period: PricePeriod | null | undefined) {
  return period === 'MONTH' ? 'mes' : 'semana';
}

export function rentalDurationLabel(
  duration: RentalDuration | null | undefined,
) {
  return {
    WEEKS: 'Por semanas',
    MONTHS: 'Por meses',
    PERMANENT: 'Permanente',
    FLEXIBLE: 'Duración flexible',
  }[duration ?? 'FLEXIBLE'];
}

export const currencyOptions: { value: Currency; label: string }[] = [
  { value: 'ARS', label: 'Pesos argentinos (ARS)' },
  { value: 'USD', label: 'Dólares estadounidenses (USD)' },
];

export const pricePeriodOptions: { value: PricePeriod; label: string }[] = [
  { value: 'WEEK', label: 'Semanal' },
  { value: 'MONTH', label: 'Mensual' },
];

export const rentalDurationOptions: {
  value: RentalDuration;
  label: string;
}[] = [
  { value: 'WEEKS', label: 'Semanas' },
  { value: 'MONTHS', label: 'Meses' },
  { value: 'PERMANENT', label: 'Permanente' },
  { value: 'FLEXIBLE', label: 'Flexible' },
];
