<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useSession } from '../session';
import {
  canEditListing,
  createMutationOwnership,
  createSelectionGuard,
} from './area-helpers';

type Status = 'DRAFT' | 'SUBMITTED' | 'REJECTED' | 'APPROVED';
type Availability = 'AVAILABLE' | 'UNAVAILABLE';
type Listing = {
  id: string;
  title: string;
  description: string;
  location: string;
  pricePerNight: number;
  maxGuests: number;
  status: Status;
  availabilityStatus: Availability;
  lastConfirmedAt: string;
  rejectionReason?: string | null;
};
type Image = {
  id: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  position: number;
};
const props = defineProps<{ area: 'OWNER' | 'ADMIN' }>();
const session = useSession();
const router = useRouter();
const listings = ref<Listing[]>([]);
const selected = ref<Listing | null>(null);
const images = ref<Image[]>([]);
const imagesLoading = ref(false);
const loading = ref(true);
const saving = ref(false);
const imageBusy = ref<'upload' | 'delete' | 'reorder' | null>(null);
const imageBusyOriginal = ref<string | null>(null);
const error = ref('');
const notice = ref('');
const selectionGuard = createSelectionGuard();
const mutationOwnership = createMutationOwnership();
const form = reactive({
  title: '',
  description: '',
  location: '',
  pricePerNight: 0,
  maxGuests: 1,
});
const message = (e: unknown) =>
  e instanceof Error ? e.message : 'No pudimos completar la operación.';
function fill(item: Listing, internal = false) {
  if ((saving.value || imageBusy.value) && !internal) return;
  selectionGuard.invalidate();
  error.value = '';
  notice.value = '';
  selected.value = item;
  images.value = [];
  imagesLoading.value = canEditListing(item.status);
  Object.assign(form, item);
  if (canEditListing(item.status)) {
    void loadImages(item);
  }
}
async function load(request?: { id: string; version: number }) {
  loading.value = true;
  error.value = '';
  try {
    const result = await session.apiRequest<Listing[]>('/listings');
    if (!request || selectionGuard.isCurrent(request, selected.value?.id)) {
      listings.value = result;
    }
  } catch (e) {
    if (!request || selectionGuard.isCurrent(request, selected.value?.id)) {
      error.value = message(e);
    }
  } finally {
    loading.value = false;
  }
}
async function loadImages(
  item: Listing,
  request = selectionGuard.begin(item.id),
) {
  error.value = '';
  try {
    const result = await session.apiRequest<Image[]>(
      `/listings/${item.id}/images`,
    );
    if (selectionGuard.isCurrent(request, selected.value?.id)) {
      images.value = result;
    }
  } catch (e) {
    if (selectionGuard.isCurrent(request, selected.value?.id)) {
      error.value = message(e);
    }
  } finally {
    if (selectionGuard.isCurrent(request, selected.value?.id)) {
      imagesLoading.value = false;
    }
  }
}
async function create() {
  if (saving.value || imageBusy.value) return;
  const mutation = mutationOwnership.acquire();
  saving.value = true;
  error.value = '';
  try {
    const item = await session.apiRequest<Listing>('/listings', {
      method: 'POST',
      body: JSON.stringify(form),
    });
    if (mutationOwnership.owns(mutation)) {
      listings.value.unshift(item);
      fill(item, true);
      notice.value = 'Borrador creado.';
    }
  } catch (e) {
    if (mutationOwnership.owns(mutation)) {
      error.value = message(e);
    }
  } finally {
    if (mutationOwnership.owns(mutation)) {
      saving.value = false;
    }
  }
}
async function save() {
  if (!selected.value || saving.value || imageBusy.value) return;
  const listingId = selected.value.id;
  const request = selectionGuard.begin(listingId);
  const mutation = mutationOwnership.acquire();
  saving.value = true;
  error.value = '';
  try {
    const item = await session.apiRequest<Listing>(`/listings/${listingId}`, {
      method: 'PATCH',
      body: JSON.stringify(form),
    });
    if (selectionGuard.isCurrent(request, selected.value?.id)) {
      Object.assign(selected.value, item);
      Object.assign(form, item);
      notice.value = 'Cambios guardados.';
      await load(request);
    }
  } catch (e) {
    if (selectionGuard.isCurrent(request, selected.value?.id)) {
      error.value = message(e);
    }
  } finally {
    if (mutationOwnership.owns(mutation)) {
      saving.value = false;
    }
  }
}
async function operation(
  path: string,
  options: RequestInit = {},
  success = 'Operación completada.',
  onSuccess?: (result: unknown) => Promise<void> | void,
) {
  if (!selected.value) return;
  if (saving.value || imageBusy.value) return;
  const listingId = selected.value.id;
  const request = selectionGuard.begin(listingId);
  const mutation = mutationOwnership.acquire();
  saving.value = true;
  error.value = '';
  try {
    const result = await session.apiRequest<unknown>(path, options);
    if (!selectionGuard.isCurrent(request, selected.value?.id)) return;
    await onSuccess?.(result);
    if (
      selected.value?.id === listingId &&
      result &&
      typeof result === 'object'
    ) {
      Object.assign(selected.value, result);
    }
    notice.value = success;
    if (selected.value?.id === listingId) await load(request);
  } catch (e) {
    if (selectionGuard.isCurrent(request, selected.value?.id)) {
      error.value = message(e);
    }
  } finally {
    if (mutationOwnership.owns(mutation)) {
      saving.value = false;
    }
  }
}
async function upload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (
    !file ||
    !selected.value ||
    !canEditListing(selected.value.status) ||
    saving.value ||
    imageBusy.value
  )
    return;
  const listingId = selected.value.id;
  const request = selectionGuard.begin(listingId);
  imageBusy.value = 'upload';
  imageBusyOriginal.value = file.name;
  error.value = '';
  const body = new FormData();
  body.append('image', file);
  try {
    await session.apiRequest(`/listings/${listingId}/images`, {
      method: 'POST',
      body,
    });
    if (selectionGuard.isCurrent(request, selected.value?.id)) {
      await loadImages(selected.value, request);
      if (selected.value?.id === listingId) {
        notice.value = 'Imagen subida.';
      }
    }
  } catch (e) {
    if (selectionGuard.isCurrent(request, selected.value?.id)) {
      error.value = message(e);
    }
  } finally {
    if (selectionGuard.isCurrent(request, selected.value?.id)) {
      imageBusy.value = null;
      imageBusyOriginal.value = null;
      (event.target as HTMLInputElement).value = '';
    }
  }
}
async function removeImage(id: string) {
  if (
    !selected.value ||
    !canEditListing(selected.value.status) ||
    imageBusy.value
  )
    return;
  const listingId = selected.value.id;
  const request = selectionGuard.begin(listingId);
  imageBusy.value = 'delete';
  imageBusyOriginal.value =
    images.value.find((image) => image.id === id)?.originalName ?? null;
  error.value = '';
  try {
    await session.apiRequest(`/listings/${listingId}/images/${id}`, {
      method: 'DELETE',
    });
    if (selectionGuard.isCurrent(request, selected.value?.id)) {
      await loadImages(selected.value, request);
      if (selected.value?.id === listingId) {
        notice.value = 'Imagen eliminada.';
      }
    }
  } catch (e) {
    if (selectionGuard.isCurrent(request, selected.value?.id)) {
      error.value = message(e);
    }
  } finally {
    if (selectionGuard.isCurrent(request, selected.value?.id)) {
      imageBusy.value = null;
      imageBusyOriginal.value = null;
    }
  }
}
async function moveImage(image: Image, delta: number) {
  if (
    !selected.value ||
    !canEditListing(selected.value.status) ||
    imageBusy.value
  )
    return;
  const position = image.position + delta;
  if (position < 0 || position >= images.value.length) return;
  const listingId = selected.value.id;
  const request = selectionGuard.begin(listingId);
  imageBusy.value = 'reorder';
  imageBusyOriginal.value = image.originalName;
  error.value = '';
  try {
    const result = await session.apiRequest<Image[]>(
      `/listings/${listingId}/images/${image.id}`,
      { method: 'PATCH', body: JSON.stringify({ position }) },
    );
    if (selectionGuard.isCurrent(request, selected.value?.id)) {
      images.value = result;
      notice.value = 'Orden de imágenes actualizado.';
    }
  } catch (e) {
    if (selectionGuard.isCurrent(request, selected.value?.id)) {
      error.value = message(e);
    }
  } finally {
    if (selectionGuard.isCurrent(request, selected.value?.id)) {
      imageBusy.value = null;
      imageBusyOriginal.value = null;
    }
  }
}
async function deleteSelected() {
  const item = selected.value;
  if (!item || saving.value || imageBusy.value) return;
  selectionGuard.invalidate();
  await operation(
    `/listings/${item.id}`,
    { method: 'DELETE' },
    'Publicación eliminada.',
    () => {
      listings.value = listings.value.filter(
        (listing) => listing.id !== item.id,
      );
      selected.value = null;
      images.value = [];
      imagesLoading.value = false;
      Object.assign(form, {
        title: '',
        description: '',
        location: '',
        pricePerNight: 0,
        maxGuests: 1,
      });
    },
  );
}
onMounted(() => {
  if (props.area === 'OWNER') void load();
});
</script>
<template>
  <section v-if="props.area === 'ADMIN'" class="card">
    <p class="eyebrow">Área ADMIN</p>
    <h2>Operación administrativa</h2>
    <p>Esta superficie pertenece a R4.</p>
  </section>
  <section v-else class="owner-area">
    <div class="page-heading">
      <div>
        <p class="eyebrow">Autoservicio OWNER</p>
        <h2>Mis publicaciones</h2>
      </div>
      <button
        class="secondary"
        type="button"
        @click="
          session.clear();
          router.push('/auth/login');
        "
      >
        Cerrar sesión
      </button>
    </div>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <p v-if="notice" class="success" role="status">{{ notice }}</p>
    <div v-if="loading" class="card" aria-busy="true">
      Cargando tus publicaciones…
    </div>
    <div v-else class="owner-layout">
      <aside class="card">
        <button
          type="button"
          :disabled="saving || imageBusy !== null"
          @click="create"
        >
          + Nuevo borrador
        </button>
        <p v-if="!listings.length">Todavía no tenés publicaciones.</p>
        <button
          v-for="item in listings"
          :key="item.id"
          class="listing-choice"
          :class="{ selected: selected?.id === item.id }"
          type="button"
          @click="fill(item)"
          :disabled="saving || imageBusy !== null"
        >
          <strong>{{ item.title || 'Sin título' }}</strong
          ><span>{{ item.status }}</span>
        </button>
      </aside>
      <article v-if="selected" class="card editor">
        <div class="status-line">
          <span class="status">{{ selected.status }}</span
          ><span v-if="selected.rejectionReason" class="error"
            >Motivo: {{ selected.rejectionReason }}</span
          >
        </div>
        <form :aria-busy="saving || imageBusy !== null" @submit.prevent="save">
          <fieldset :disabled="saving || imageBusy !== null">
            <label
              >Título<input
                v-model="form.title"
                required
                maxlength="120" /></label
            ><label
              >Descripción<textarea
                v-model="form.description"
                required
                maxlength="5000"
                rows="4"
              /></label
            ><label
              >Ubicación<input v-model="form.location" required maxlength="240"
            /></label>
            <div class="form-row">
              <label
                >Precio por noche<input
                  v-model.number="form.pricePerNight"
                  type="number"
                  min="0"
                  required /></label
              ><label
                >Huéspedes<input
                  v-model.number="form.maxGuests"
                  type="number"
                  min="1"
                  required
              /></label>
            </div>
            <button
              :disabled="
                saving || !['DRAFT', 'REJECTED'].includes(selected.status)
              "
              type="submit"
            >
              Guardar cambios
            </button>
          </fieldset>
        </form>
        <section
          class="subsection"
          :aria-busy="imageBusy !== null"
          :aria-label="imageBusy ? `Imágenes: ${imageBusy}` : 'Imágenes'"
        >
          <h3>Imágenes</h3>
          <p
            v-if="!canEditListing(selected.status)"
            class="notice"
            role="status"
          >
            Las imágenes se gestionan cuando la publicación está en borrador o
            fue rechazada.
          </p>
          <input
            id="listing-image-upload"
            type="file"
            aria-label="Seleccionar imagen para subir"
            accept="image/jpeg,image/png,image/webp"
            :disabled="
              saving || imageBusy !== null || !canEditListing(selected.status)
            "
            @change="upload"
          />
          <p v-if="imagesLoading" role="status" aria-live="polite">
            Cargando imágenes…
          </p>
          <p v-else-if="imageBusy" role="status" aria-live="polite">
            {{
              imageBusy === 'upload'
                ? 'Subiendo imagen…'
                : imageBusy === 'delete'
                  ? 'Eliminando imagen…'
                  : 'Actualizando orden…'
            }}{{ imageBusyOriginal ? ` (${imageBusyOriginal})` : '' }}
          </p>
          <p v-else-if="canEditListing(selected.status) && !images.length">
            No hay imágenes cargadas.
          </p>
          <ul v-else class="image-list" :aria-busy="imageBusy !== null">
            <li v-for="image in images" :key="image.id">
              <span>{{ image.position + 1 }}. {{ image.originalName }}</span
              ><span
                ><button
                  type="button"
                  :disabled="
                    imageBusy !== null ||
                    image.position === 0 ||
                    !canEditListing(selected.status)
                  "
                  :aria-label="`Mover imagen ${image.originalName} (${image.id}) hacia arriba`"
                  @click="moveImage(image, -1)"
                >
                  ↑</button
                ><button
                  type="button"
                  :disabled="
                    imageBusy !== null ||
                    image.position === images.length - 1 ||
                    !canEditListing(selected.status)
                  "
                  :aria-label="`Mover imagen ${image.originalName} (${image.id}) hacia abajo`"
                  @click="moveImage(image, 1)"
                >
                  ↓</button
                ><button
                  type="button"
                  class="secondary"
                  :aria-label="`Borrar imagen ${image.originalName} (${image.id})`"
                  :disabled="
                    imageBusy !== null || !canEditListing(selected.status)
                  "
                  @click="removeImage(image.id)"
                >
                  Borrar
                </button></span
              >
            </li>
          </ul>
        </section>
        <section class="subsection actions">
          <button
            type="button"
            :disabled="
              saving ||
              imageBusy !== null ||
              !['DRAFT', 'REJECTED'].includes(selected.status)
            "
            @click="
              operation(
                `/listings/${selected.id}/submit`,
                { method: 'POST' },
                'Enviado a revisión.',
              )
            "
          >
            Enviar a revisión</button
          ><button
            type="button"
            :disabled="saving || imageBusy !== null"
            @click="
              operation(
                `/listings/${selected.id}/availability`,
                {
                  method: 'PATCH',
                  body: JSON.stringify({
                    availabilityStatus:
                      selected.availabilityStatus === 'AVAILABLE'
                        ? 'UNAVAILABLE'
                        : 'AVAILABLE',
                  }),
                },
                'Disponibilidad actualizada.',
              )
            "
          >
            {{
              selected.availabilityStatus === 'AVAILABLE'
                ? 'Marcar no disponible'
                : 'Marcar disponible'
            }}</button
          ><button
            type="button"
            class="secondary"
            :disabled="saving || imageBusy !== null"
            @click="
              operation(
                `/listings/${selected.id}/reconfirm`,
                { method: 'POST' },
                'Disponibilidad reconfirmada.',
              )
            "
          >
            Reconfirmar</button
          ><small
            >Última confirmación:
            {{ new Date(selected.lastConfirmedAt).toLocaleString() }}</small
          >
        </section>
        <button
          v-if="['DRAFT', 'REJECTED'].includes(selected.status)"
          type="button"
          class="danger"
          :disabled="saving || imageBusy !== null"
          @click="deleteSelected"
        >
          Eliminar publicación
        </button>
      </article>
      <div v-else class="card empty-state">
        <h3>Elegí una publicación</h3>
        <p>Creá un borrador o seleccioná una publicación para editarla.</p>
      </div>
    </div>
  </section>
</template>
