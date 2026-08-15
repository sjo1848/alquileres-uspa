<script setup lang="ts">
import { reactive, ref } from 'vue';
import { apiUrl, ApiError, request } from '../api';

type Image = { id: string; contentType: string };
type Listing = {
  id: string;
  title: string;
  description: string;
  location: string;
  pricePerNight: number;
  maxGuests: number;
  images: Image[];
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
  minPricePerNight: '',
  maxPricePerNight: '',
  maxGuests: '',
});
const page = ref<Page | null>(null);
const loading = ref(false);
const error = ref('');
const failedImages = ref(new Set<string>());
const pageSize = 20;
const query = (pageNumber: number) =>
  new URLSearchParams(
    Object.entries({ ...filters, page: pageNumber, pageSize }).filter(
      ([, value]) => value !== '',
    ) as string[][],
  ).toString();
async function search(pageNumber = 1) {
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
void search();
</script>
<template>
  <section class="hero">
    <p class="eyebrow">BUSCADOR</p>
    <h2>Encontrá tu próxima estadía</h2>
    <p>Alquileres publicados en Uspallata, con disponibilidad confirmada.</p>
  </section>
  <form class="filters card" @submit.prevent="search()">
    <h3>Filtrar alojamientos</h3>
    <label
      >Ubicación
      <input
        v-model="filters.location"
        name="location"
        autocomplete="address-level2"
    /></label>
    <label
      >Precio mínimo por noche
      <input
        v-model="filters.minPricePerNight"
        name="minPricePerNight"
        type="number"
        min="0"
    /></label>
    <label
      >Precio máximo por noche
      <input
        v-model="filters.maxPricePerNight"
        name="maxPricePerNight"
        type="number"
        min="0"
    /></label>
    <label
      >Huéspedes máximos
      <input v-model="filters.maxGuests" name="maxGuests" type="number" min="1"
    /></label>
    <button type="submit" :disabled="loading">
      {{ loading ? 'Buscando…' : 'Buscar' }}
    </button>
  </form>
  <p v-if="error" class="error" role="alert">{{ error }}</p>
  <p v-if="loading" aria-live="polite">Cargando alojamientos…</p>
  <template v-else-if="page">
    <p aria-live="polite">
      {{ page.totalItems }} alojamiento{{
        page.totalItems === 1 ? '' : 's'
      }}
      encontrado{{ page.totalItems === 1 ? '' : 's' }}.
    </p>
    <section
      v-if="page.items.length"
      class="listing-grid"
      aria-label="Alojamientos publicados"
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
        <p>
          <strong>${{ listing.pricePerNight }}</strong> por noche · hasta
          {{ listing.maxGuests }} huéspedes
        </p>
        <RouterLink class="button-link" :to="`/listings/${listing.id}`"
          >Ver ficha</RouterLink
        >
      </article>
    </section>
    <p v-else class="card" role="status">
      No encontramos alojamientos con esos filtros.
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
