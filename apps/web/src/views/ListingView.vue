<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { apiUrl, ApiError, request } from '../api';
import { useRoute } from 'vue-router';
const route = useRoute();
type Listing = {
  id: string;
  title: string;
  description: string;
  location: string;
  pricePerNight: number;
  maxGuests: number;
  availabilityStatus: 'AVAILABLE' | 'UNAVAILABLE';
  lastConfirmedAt: string;
  freshnessStatus: 'FRESH' | 'STALE';
  images: { id: string; contentType: string; position: number }[];
};
const listing = ref<Listing>();
const loading = ref(true);
const error = ref('');
const feedback = ref('');
const contactError = ref('');
const submitting = ref(false);
const contact = reactive({ visitorName: '', visitorEmail: '', message: '' });
async function load() {
  try {
    listing.value = await request<Listing>(
      `/public/listings/${route.params.id}`,
    );
  } catch (e) {
    error.value =
      e instanceof ApiError ? e.message : 'No pudimos cargar la ficha.';
  } finally {
    loading.value = false;
  }
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
const freshness = computed(() =>
  listing.value?.freshnessStatus === 'FRESH'
    ? 'Confirmación reciente'
    : 'Confirmación desactualizada',
);
void load();
</script>
<template>
  <p v-if="loading" aria-live="polite">Cargando ficha…</p>
  <p v-else-if="error" class="error" role="alert">{{ error }}</p>
  <template v-else-if="listing"
    ><p><RouterLink to="/">← Volver al buscador</RouterLink></p>
    <article class="detail card">
      <p class="eyebrow">{{ listing.location }}</p>
      <h2>{{ listing.title }}</h2>
      <div class="gallery">
        <img
          v-for="image in listing.images"
          :key="image.id"
          :src="apiUrl(`/public/listings/${listing.id}/images/${image.id}`)"
          :alt="`Imagen de ${listing.title}`"
        />
      </div>
      <p>{{ listing.description }}</p>
      <p>
        <strong>${{ listing.pricePerNight }}</strong> por noche · hasta
        {{ listing.maxGuests }} huéspedes
      </p>
      <p
        class="status"
        :class="
          listing.availabilityStatus === 'AVAILABLE'
            ? 'available'
            : 'unavailable'
        "
      >
        {{
          listing.availabilityStatus === 'AVAILABLE'
            ? 'Disponible'
            : 'No disponible'
        }}
      </p>
      <p role="status">
        {{ freshness }} · última confirmación:
        {{ new Date(listing.lastConfirmedAt).toLocaleDateString('es-AR') }}
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
