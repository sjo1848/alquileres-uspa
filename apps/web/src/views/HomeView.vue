<script setup lang="ts">
import { reactive, ref } from 'vue';
import { apiUrl, ApiError, request } from '../api';
import {
  availabilityLabel,
  availabilityQuery,
  freshnessLabel,
  freshnessMarker,
  type AvailabilityStatus,
  type FreshnessStatus,
} from './availability-helpers';
import {
  formatRentalPrice,
  hasRentalDomainData,
  rentalDurationLabel,
  type Currency,
  type PricePeriod,
  type RentalDuration,
} from './rental-domain';

type Image = { id: string; contentType: string };
type Listing = {
  id: string;
  title: string;
  description: string;
  location: string;
  priceAmount: number | null;
  pricePeriod: PricePeriod | null;
  rentalDuration: RentalDuration | null;
  maxOccupants: number | null;
  currency: Currency | null;
  images: Image[];
  availabilityStatus: AvailabilityStatus;
  lastConfirmedAt: string | null;
  freshnessStatus: FreshnessStatus;
};
type Page = {
  items: Listing[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};
const filters = reactive({
  location: '',
  minPriceAmount: '',
  maxPriceAmount: '',
  currency: '' as Currency | '',
  maxOccupants: '',
  soloDisponibles: false,
});
const page = ref<Page | null>(null);
const loading = ref(false);
const error = ref('');
const failedPage = ref(1);
const failedImages = ref(new Set<string>());
const pageSize = 20;
const query = (pageNumber: number) =>
  new URLSearchParams(
    Object.entries({
      location: filters.location,
      minPriceAmount: filters.minPriceAmount,
      maxPriceAmount: filters.maxPriceAmount,
      currency: filters.currency,
      maxOccupants: filters.maxOccupants,
      ...availabilityQuery(filters.soloDisponibles),
      page: pageNumber,
      pageSize,
    }).filter(([, value]) => value !== '') as string[][],
  ).toString();
async function search(pageNumber = 1) {
  failedPage.value = pageNumber;
  loading.value = true;
  error.value = '';
  try {
    page.value = await request<Page>(`/public/listings?${query(pageNumber)}`);
    failedImages.value = new Set();
  } catch (e) {
    error.value =
      e instanceof ApiError ? e.message : 'No pudimos cargar el catálogo.';
  } finally {
    loading.value = false;
  }
}
function imageUrl(listing: Listing) {
  const image = listing.images[0];
  return image
    ? apiUrl(`/public/listings/${listing.id}/images/${image.id}`)
    : '';
}
function imageFailed(listingId: string) {
  failedImages.value = new Set(failedImages.value).add(listingId);
}
function resetFilters() {
  filters.location = '';
  filters.minPriceAmount = '';
  filters.maxPriceAmount = '';
  filters.currency = '';
  filters.maxOccupants = '';
  filters.soloDisponibles = false;
  void search();
}
void search();
</script>
<template>
  <section class="hero">
    <p class="eyebrow">BUSCADOR</p>
    <h2>Encontrá tu próximo alquiler</h2>
    <p>
      Publicaciones en Uspallata, con información de disponibilidad.
    </p>
  </section>
  <form class="filters card" @submit.prevent="search()">
    <h3>Filtrar publicaciones</h3>
    <label
      >Ubicación
      <input
        v-model="filters.location"
        name="location"
        autocomplete="address-level2"
    /></label>
    <label
      >Importe mínimo
      <input
        v-model="filters.minPriceAmount"
        name="minPriceAmount"
        type="number"
        min="0"
    /></label>
    <label
      >Importe máximo
      <input
        v-model="filters.maxPriceAmount"
        name="maxPriceAmount"
        type="number"
        min="0"
    /></label>
    <label
      >Moneda<select v-model="filters.currency" name="currency">
        <option value="">Cualquier moneda</option>
        <option value="ARS">Pesos argentinos (ARS)</option>
        <option value="USD">Dólares estadounidenses (USD)</option>
      </select></label
    >
    <label
      >Ocupantes máximos
      <input
        v-model="filters.maxOccupants"
        name="maxOccupants"
        type="number"
        min="1"
    /></label>
    <label class="availability-filter">
      <input
        v-model="filters.soloDisponibles"
        name="soloDisponibles"
        type="checkbox"
      />
      Solo disponibles
    </label>
    <button type="submit" :disabled="loading">
      {{ loading ? 'Buscando…' : 'Buscar' }}
    </button>
    <button
      type="button"
      class="secondary"
      :disabled="loading"
      @click="resetFilters"
    >
      Restablecer filtros
    </button>
  </form>
  <div v-if="error" class="error-state" role="alert">
    <p class="error">{{ error }}</p>
    <p v-if="page" class="previous-results" role="status">
      Mostrando los resultados anteriores.
    </p>
    <button type="button" class="inline-retry" @click="search(failedPage)">
      Reintentar búsqueda
    </button>
  </div>
  <p v-if="loading" aria-live="polite">Cargando publicaciones…</p>
  <template v-else-if="page">
    <p aria-live="polite">
      {{ page.totalItems }} publicación{{
        page.totalItems === 1 ? '' : 's'
      }}
      encontrado{{ page.totalItems === 1 ? '' : 's' }}.
    </p>
      <section
      v-if="page.items.length"
      class="listing-grid"
        aria-label="Publicaciones disponibles"
    >
      <article
        v-for="listing in page.items"
        :key="listing.id"
        class="card listing-card"
      >
        <div
          v-if="imageUrl(listing) && !failedImages.has(listing.id)"
          class="listing-image"
        >
          <img
            :src="imageUrl(listing)"
            :alt="`Imagen de ${listing.title} en ${listing.location}`"
            @error="imageFailed(listing.id)"
          />
        </div>
        <div
          v-else
          class="image-placeholder"
          role="img"
          :aria-label="`Sin imagen disponible para ${listing.title}`"
        >
          🏔️
        </div>
        <p class="eyebrow">{{ listing.location }}</p>
        <h3>{{ listing.title }}</h3>
        <p>{{ listing.description }}</p>
        <p class="rental-summary">{{ formatRentalPrice(listing) }}</p>
        <p v-if="hasRentalDomainData(listing)">
          Duración: {{ rentalDurationLabel(listing.rentalDuration) }}
        </p>
        <div class="availability-summary" aria-label="Disponibilidad">
          <p
            class="status"
            :class="[
              listing.availabilityStatus === 'AVAILABLE'
                ? 'available'
                : 'unavailable',
              listing.freshnessStatus !== 'FRESH'
                ? 'availability-unconfirmed'
                : '',
            ]"
          >
            {{
              availabilityLabel(
                listing.availabilityStatus,
                listing.freshnessStatus,
              )
            }}
          </p>
          <p
            class="freshness"
            :class="`freshness-${listing.freshnessStatus.toLowerCase()}`"
          >
            <span aria-hidden="true">{{
              freshnessMarker(listing.freshnessStatus)
            }}</span>
            {{
              freshnessLabel(listing.freshnessStatus, listing.lastConfirmedAt)
            }}
          </p>
        </div>
        <RouterLink class="button-link" :to="`/listings/${listing.id}`"
          >Ver ficha</RouterLink
        >
      </article>
    </section>
    <p v-else class="card" role="status">
      No encontramos publicaciones con esos filtros.
    </p>
    <nav
      v-if="page.totalPages > 1"
      class="pagination"
      aria-label="Paginación del catálogo"
    >
      <button
        type="button"
        :disabled="loading || page.page <= 1"
        @click="search(page.page - 1)"
      >
        Anterior
      </button>
      <span aria-live="polite"
        >Página {{ page.page }} de {{ page.totalPages }}</span
      >
      <button
        type="button"
        :disabled="loading || page.page >= page.totalPages"
        @click="search(page.page + 1)"
      >
        Siguiente
      </button>
    </nav>
  </template>
</template>
