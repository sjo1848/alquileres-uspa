<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { apiUrl, ApiError, publicListingPath, request } from '../api';
import { useRoute } from 'vue-router';
import {
  availabilityLabel,
  formatConfirmationDate,
  freshnessLabel,
  freshnessMarker,
  type AvailabilityStatus,
  type FreshnessStatus,
} from './availability-helpers';
import {
  formatRentalPrice,
  rentalDurationLabel,
  type Currency,
  type PricePeriod,
  type RentalDuration,
} from './rental-domain';
const route = useRoute();
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
  availabilityStatus: AvailabilityStatus;
  lastConfirmedAt: string | null;
  freshnessStatus: FreshnessStatus;
  images: { id: string; contentType: string; position: number }[];
};
const listing = ref<Listing>();
const loading = ref(true);
const error = ref('');
const feedback = ref('');
const contactError = ref('');
const submitting = ref(false);
const failedImages = ref(new Set<string>());
const contact = reactive({ visitorName: '', visitorEmail: '', message: '' });
function resetState() {
  loading.value = true;
  error.value = '';
  listing.value = undefined;
  feedback.value = '';
  contactError.value = '';
  submitting.value = false;
  failedImages.value = new Set();
  contact.visitorName = '';
  contact.visitorEmail = '';
  contact.message = '';
}
async function load(id: string) {
  resetState();
  try {
    const nextListing = await request<Listing>(publicListingPath(id));
    if (route.params.id === id) listing.value = nextListing;
  } catch (e) {
    if (route.params.id === id) {
      error.value =
        e instanceof ApiError ? e.message : 'No pudimos cargar la ficha.';
    }
  } finally {
    if (route.params.id === id) loading.value = false;
  }
}
function retry() {
  void load(String(route.params.id));
}
async function sendContact() {
  submitting.value = true;
  feedback.value = '';
  contactError.value = '';
  try {
    await request(`/public/listings/${route.params.id}/contact`, {
      method: 'POST',
      body: JSON.stringify(contact),
    });
    feedback.value =
      'Tu consulta fue enviada. El propietario podrá contactarte.';
    contact.visitorName = '';
    contact.visitorEmail = '';
    contact.message = '';
  } catch (e) {
    contactError.value =
      e instanceof ApiError ? e.message : 'No pudimos enviar tu consulta.';
  } finally {
    submitting.value = false;
  }
}
function imageFailed(imageId: string) {
  failedImages.value = new Set(failedImages.value).add(imageId);
}
const freshness = computed(() =>
  freshnessLabel(
    listing.value?.freshnessStatus,
    listing.value?.lastConfirmedAt,
  ),
);
watch(
  () => route.params.id,
  (id) => void load(String(id)),
  { immediate: true },
);
</script>
<template>
  <p v-if="loading" aria-live="polite">Cargando ficha…</p>
  <section v-else-if="error" class="error-state card" role="alert">
    <p class="error">{{ error }}</p>
    <div class="session-actions">
      <button type="button" @click="retry">Reintentar</button>
      <RouterLink class="button-link secondary" to="/"
        >Volver al buscador</RouterLink
      >
    </div>
  </section>
  <template v-else-if="listing"
    ><p><RouterLink to="/">← Volver al buscador</RouterLink></p>
    <article class="detail card">
      <p class="eyebrow">{{ listing.location }}</p>
      <h2>{{ listing.title }}</h2>
      <div v-if="listing.images.length" class="gallery">
        <template v-for="image in listing.images" :key="image.id">
          <img
            v-if="!failedImages.has(image.id)"
            :src="apiUrl(`/public/listings/${listing.id}/images/${image.id}`)"
            :alt="`Imagen de ${listing.title}`"
            @error="imageFailed(image.id)"
          />
          <div
            v-else
            class="image-placeholder"
            role="img"
            :aria-label="`Imagen no disponible para ${listing.title}`"
          >
            🏔️
          </div>
        </template>
      </div>
      <div
        v-else
        class="image-placeholder gallery-placeholder"
        role="img"
        :aria-label="`Galería vacía para ${listing.title}`"
      >
        <span>Sin imágenes disponibles</span>
      </div>
      <p>{{ listing.description }}</p>
      <p class="rental-summary">{{ formatRentalPrice(listing) }}</p>
      <p v-if="listing.rentalDuration">
        Duración: {{ rentalDurationLabel(listing.rentalDuration) }}
      </p>
      <p
        class="status"
        :class="[
          listing.availabilityStatus === 'AVAILABLE'
            ? 'available'
            : 'unavailable',
          listing.freshnessStatus !== 'FRESH' ? 'availability-unconfirmed' : '',
        ]"
      >
        {{
          availabilityLabel(listing.availabilityStatus, listing.freshnessStatus)
        }}
      </p>
      <p
        class="freshness"
        :class="`freshness-${listing.freshnessStatus.toLowerCase()}`"
        role="status"
      >
        <span aria-hidden="true">{{
          freshnessMarker(listing.freshnessStatus)
        }}</span>
        {{ freshness }} · última confirmación:
        {{ formatConfirmationDate(listing.lastConfirmedAt) }}
      </p>
    </article>
    <section class="card contact">
      <h3>Contactar al propietario</h3>
      <form @submit.prevent="sendContact">
        <label
          >Nombre
          <input
            v-model="contact.visitorName"
            required
            maxlength="120" /></label
        ><label
          >Email
          <input
            v-model="contact.visitorEmail"
            required
            type="email"
            maxlength="254" /></label
        ><label
          >Mensaje
          <textarea
            v-model="contact.message"
            required
            maxlength="2000"
            rows="5"
          ></textarea></label
        ><button :disabled="submitting">
          {{ submitting ? 'Enviando…' : 'Enviar consulta' }}
        </button>
      </form>
      <p v-if="feedback" class="success" role="status">{{ feedback }}</p>
      <p v-if="contactError" class="error" role="alert">{{ contactError }}</p>
    </section>
  </template>
</template>
