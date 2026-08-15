<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { apiUrl } from '../api';
import { useSession } from '../session';
import { createMutationOwnership, createSelectionGuard } from './area-helpers';

type Status = 'DRAFT' | 'SUBMITTED' | 'REJECTED' | 'APPROVED';
type Availability = 'AVAILABLE' | 'UNAVAILABLE';
type Owner = { id: string; email: string; role: 'OWNER' };
type Image = {
  id: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  position: number;
};
type Listing = {
  id: string;
  title: string;
  description: string;
  location: string;
  pricePerNight: number;
  maxGuests: number;
  status: Status;
  publicationStatus: 'UNPUBLISHED' | 'PUBLISHED';
  availabilityStatus: Availability;
  lastConfirmedAt: string;
  rejectionReason?: string | null;
  updatedAt: string;
  owner: Owner;
  images: Image[];
};
type Audit = {
  id: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  listingId?: string | null;
  targetOwnerId?: string | null;
  metadata: unknown;
  createdAt: string;
  actor: { id: string; email: string; role: string };
  targetOwner?: { id: string; email: string; role: string } | null;
};

const session = useSession();
const listings = ref<Listing[]>([]);
const directoryOwners = ref<Owner[]>([]);
const selected = ref<Listing | null>(null);
const audits = ref<Audit[]>([]);
const loading = ref(true);
const detailLoading = ref(false);
const auditLoading = ref(false);
const busy = ref<string | null>(null);
const error = ref('');
const notice = ref('');
const rejectReason = ref('');
const form = reactive({
  title: '',
  description: '',
  location: '',
  pricePerNight: 0,
  maxGuests: 1,
  ownerId: '',
});
const selectionGuard = createSelectionGuard();
const mutationOwnership = createMutationOwnership();
let queueVersion = 0;

const owners = computed(() => {
  const unique = new Map<string, Owner>();
  for (const owner of directoryOwners.value) unique.set(owner.id, owner);
  for (const listing of listings.value)
    unique.set(listing.owner.id, listing.owner);
  return [...unique.values()];
});
const message = (errorValue: unknown) =>
  errorValue instanceof Error
    ? errorValue.message
    : 'No pudimos completar la operación.';
function resetFeedback() {
  error.value = '';
  notice.value = '';
}
function setForm(listing: Listing | null) {
  Object.assign(
    form,
    listing
      ? { ...listing, ownerId: listing.owner.id }
      : {
          title: '',
          description: '',
          location: '',
          pricePerNight: 0,
          maxGuests: 1,
          ownerId: owners.value[0]?.id ?? '',
        },
  );
}
async function loadQueue(preserveSelection = false) {
  const requestVersion = ++queueVersion;
  loading.value = true;
  resetFeedback();
  try {
    const result = await session.apiRequest<Listing[]>(
      '/admin/listings/review',
    );
    if (requestVersion !== queueVersion) return;
    listings.value = result;
    if (selected.value) {
      const fresh = result.find((item) => item.id === selected.value?.id);
      if (fresh) await select(fresh);
      else {
        if (!preserveSelection) {
          selected.value = null;
          setForm(null);
        }
      }
    }
  } catch (e) {
    if (requestVersion === queueVersion) error.value = message(e);
  } finally {
    if (requestVersion === queueVersion) loading.value = false;
  }
}
async function loadOwners() {
  try {
    directoryOwners.value = await session.apiRequest<Owner[]>('/admin/owners');
  } catch (e) {
    error.value = message(e);
  }
}
async function select(item: Listing) {
  const request = selectionGuard.begin(item.id);
  selected.value = item;
  setForm(item);
  resetFeedback();
  detailLoading.value = true;
  try {
    const detail = await session.apiRequest<Listing>(
      `/admin/listings/${item.id}`,
    );
    if (!selectionGuard.isCurrent(request, selected.value?.id)) return;
    selected.value = detail;
    setForm(detail);
    await loadAudit(item.id, request);
  } catch (e) {
    if (selectionGuard.isCurrent(request, selected.value?.id))
      error.value = message(e);
  } finally {
    if (selectionGuard.isCurrent(request, selected.value?.id))
      detailLoading.value = false;
  }
}
async function loadAudit(
  listingId?: string,
  request = listingId ? selectionGuard.begin(listingId) : undefined,
) {
  const isCurrent = () =>
    !request || selectionGuard.isCurrent(request, selected.value?.id);
  auditLoading.value = true;
  try {
    const result = await session.apiRequest<Audit[]>(
      listingId
        ? `/admin/listings/audit?listingId=${encodeURIComponent(listingId)}`
        : '/admin/listings/audit',
    );
    if (isCurrent()) audits.value = result;
  } catch (e) {
    if (isCurrent()) error.value = message(e);
  } finally {
    if (isCurrent()) auditLoading.value = false;
  }
}
async function review(path: string, success: string, body?: object) {
  if (!selected.value || busy.value) return;
  const id = selected.value.id;
  const mutation = mutationOwnership.acquire();
  const request = selectionGuard.begin(id);
  busy.value = path;
  resetFeedback();
  try {
    const result = await session.apiRequest<Listing>(
      `/admin/listings/${id}/${path}`,
      { method: 'POST', ...(body ? { body: JSON.stringify(body) } : {}) },
    );
    notice.value = success;
    if (!mutationOwnership.owns(mutation)) return;
    if (result && selectionGuard.isCurrent(request, selected.value?.id))
      selected.value = result;
    await loadQueue(true);
    if (mutationOwnership.owns(mutation)) {
      if (selected.value?.id === id) await select(selected.value);
      else await loadAudit(id);
    }
  } catch (e) {
    if (mutationOwnership.owns(mutation)) error.value = message(e);
  } finally {
    if (mutationOwnership.owns(mutation)) busy.value = null;
  }
}
async function submitRejection() {
  if (rejectReason.value.trim().length < 3) {
    error.value = 'Ingresá un motivo de al menos 3 caracteres.';
    return;
  }
  await review('reject', 'Publicación rechazada.', {
    reason: rejectReason.value.trim(),
  });
  rejectReason.value = '';
}
async function assistedCreate() {
  if (busy.value || !form.ownerId) return;
  const mutation = mutationOwnership.acquire();
  busy.value = 'assisted';
  resetFeedback();
  try {
    const { ownerId, ...listing } = form;
    const result = await session.apiRequest<Listing>(
      '/admin/listings/assisted',
      { method: 'POST', body: JSON.stringify({ ...listing, ownerId }) },
    );
    if (!mutationOwnership.owns(mutation)) return;
    listings.value = [
      result,
      ...listings.value.filter((item) => item.id !== result.id),
    ];
    selected.value = result;
    setForm(result);
    notice.value = 'Borrador asistido creado y auditado.';
    await loadAudit(result.id);
  } catch (e) {
    if (mutationOwnership.owns(mutation)) error.value = message(e);
  } finally {
    if (mutationOwnership.owns(mutation)) busy.value = null;
  }
}
async function assisted(
  path: string,
  method: 'PATCH' | 'POST' | 'DELETE',
  body?: object,
  success = 'Operación asistida completada.',
) {
  if (!selected.value || busy.value) return;
  const id = selected.value.id;
  const mutation = mutationOwnership.acquire();
  busy.value = path;
  resetFeedback();
  try {
    const result = await session.apiRequest<Listing>(
      `/admin/listings/assisted/${id}${path ? `/${path}` : ''}`,
      { method, ...(body ? { body: JSON.stringify(body) } : {}) },
    );
    if (!mutationOwnership.owns(mutation)) return;
    notice.value = success;
    if (method === 'DELETE') {
      listings.value = listings.value.filter((item) => item.id !== id);
      selected.value = null;
      setForm(null);
      audits.value = [];
    } else {
      selected.value = result;
      setForm(result);
      listings.value = listings.value.map((item) =>
        item.id === id ? result : item,
      );
      await loadAudit(id);
    }
  } catch (e) {
    if (mutationOwnership.owns(mutation)) error.value = message(e);
  } finally {
    if (mutationOwnership.owns(mutation)) busy.value = null;
  }
}
async function assistedSave() {
  if (!selected.value) return;
  const { ownerId, ...listing } = form;
  void ownerId;
  await assisted('', 'PATCH', listing, 'Cambios asistidos guardados.');
}
function imageUrl(listing: Listing, image: Image) {
  return apiUrl(`/admin/listings/${listing.id}/images/${image.id}`);
}
function metadata(value: unknown) {
  return value && typeof value === 'object' ? JSON.stringify(value) : '';
}
function canEdit(item: Listing) {
  return item.status === 'DRAFT' || item.status === 'REJECTED';
}
onMounted(() => {
  void loadQueue();
  void loadOwners();
});
</script>

<template>
  <section class="admin-area">
    <div class="page-heading">
      <div>
        <p class="eyebrow">Área ADMIN · R4</p>
        <h2>Revisión y asistencia</h2>
      </div>
      <button class="secondary" type="button" @click="session.clear()">
        Cerrar sesión
      </button>
    </div>
    <p class="notice">Sesión activa: {{ session.user.value?.email }}</p>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <p v-if="notice" class="success" role="status">{{ notice }}</p>
    <div class="admin-layout">
      <aside class="card queue" aria-label="Cola de revisión">
        <div class="status-line">
          <h3>Cola de revisión</h3>
          <button
            class="secondary"
            type="button"
            :disabled="loading || !!busy"
            @click="loadQueue"
          >
            Actualizar
          </button>
        </div>
        <p v-if="loading" role="status" aria-live="polite">Cargando cola…</p>
        <p v-else-if="!listings.length" class="empty-state" role="status">
          No hay publicaciones pendientes. Podés iniciar una asistencia si hay
          un owner en la cola.
        </p>
        <button
          v-for="item in listings"
          :key="item.id"
          class="listing-choice"
          :class="{ selected: selected?.id === item.id }"
          type="button"
          :disabled="!!busy"
          @click="select(item)"
        >
          <strong>{{ item.title || 'Sin título' }}</strong
          ><span>{{ item.status }} · {{ item.owner.email }}</span>
        </button>
      </aside>

      <article class="card editor" aria-live="polite">
        <p v-if="detailLoading" role="status">Cargando detalle…</p>
        <template v-else-if="selected">
          <div class="status-line">
            <div>
              <span class="status">{{ selected.status }}</span> ·
              {{ selected.publicationStatus }}
            </div>
            <span>Owner: {{ selected.owner.email }}</span>
          </div>
          <p v-if="selected.rejectionReason" class="error">
            Motivo de rechazo: {{ selected.rejectionReason }}
          </p>
          <div class="admin-detail">
            <h3>{{ selected.title }}</h3>
            <p>{{ selected.description }}</p>
            <p>
              {{ selected.location }} · ${{ selected.pricePerNight }} por noche
              · {{ selected.maxGuests }} huéspedes
            </p>
          </div>
          <section class="subsection">
            <h3>Imágenes disponibles</h3>
            <div v-if="!selected.images.length" class="empty-state">
              Sin imágenes.
            </div>
            <div v-else class="admin-gallery">
              <img
                v-for="image in selected.images"
                :key="image.id"
                :src="imageUrl(selected, image)"
                :alt="`Imagen ${image.position + 1} de ${selected.title}`"
              />
            </div>
          </section>
          <section
            v-if="selected.status === 'SUBMITTED'"
            class="subsection review-actions"
          >
            <h3>Decisión</h3>
            <button
              type="button"
              :disabled="!!busy"
              @click="review('approve', 'Publicación aprobada.')"
            >
              {{ busy === 'approve' ? 'Aprobando…' : 'Aprobar' }}</button
            ><label
              >Motivo del rechazo<textarea
                v-model="rejectReason"
                rows="3"
                maxlength="1000"
                placeholder="Indicá qué debe corregirse"
              ></textarea></label
            ><button
              class="danger"
              type="button"
              :disabled="!!busy"
              @click="submitRejection"
            >
              Rechazar
            </button>
          </section>
          <section
            v-if="
              selected.status === 'APPROVED' &&
              selected.publicationStatus === 'UNPUBLISHED'
            "
            class="subsection"
          >
            <button
              type="button"
              :disabled="!!busy"
              @click="review('publish', 'Publicación visible en el catálogo.')"
            >
              {{ busy === 'publish' ? 'Publicando…' : 'Publicar en catálogo' }}
            </button>
          </section>
          <section class="subsection assisted-tools">
            <h3>Operación asistida</h3>
            <form @submit.prevent="assistedSave">
              <div class="form-row">
                <label
                  >Título<input v-model="form.title" maxlength="120" /></label
                ><label
                  >Ubicación<input v-model="form.location" maxlength="240"
                /></label>
              </div>
              <label
                >Descripción<textarea
                  v-model="form.description"
                  maxlength="5000"
                  rows="3"
                ></textarea>
              </label>
              <div class="form-row">
                <label
                  >Precio<input
                    v-model.number="form.pricePerNight"
                    type="number"
                    min="0" /></label
                ><label
                  >Huéspedes<input
                    v-model.number="form.maxGuests"
                    type="number"
                    min="1"
                /></label>
              </div>
              <button type="submit" :disabled="!!busy || !canEdit(selected)">
                Guardar edición asistida
              </button>
            </form>
            <div class="actions">
              <button
                type="button"
                :disabled="!!busy"
                @click="
                  assisted(
                    'availability',
                    'PATCH',
                    {
                      availabilityStatus:
                        selected.availabilityStatus === 'AVAILABLE'
                          ? 'UNAVAILABLE'
                          : 'AVAILABLE',
                    },
                    'Disponibilidad asistida actualizada.',
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
                :disabled="!!busy"
                @click="
                  assisted(
                    'reconfirm',
                    'POST',
                    undefined,
                    'Disponibilidad reconfirmada.',
                  )
                "
              >
                Reconfirmar</button
              ><button
                type="button"
                :disabled="!!busy || !canEdit(selected)"
                @click="
                  assisted('submit', 'POST', undefined, 'Enviado a revisión.')
                "
              >
                Enviar a revisión</button
              ><button
                class="danger"
                type="button"
                :disabled="!!busy || !canEdit(selected)"
                @click="
                  assisted('', 'DELETE', undefined, 'Borrador eliminado.')
                "
              >
                Eliminar borrador
              </button>
            </div>
          </section>
          <p>
            <RouterLink
              v-if="selected.publicationStatus === 'PUBLISHED'"
              :to="`/listings/${selected.id}`"
              >Ver publicación pública</RouterLink
            >
          </p>
        </template>
        <div v-else class="empty-state">
          <h3>Elegí una publicación</h3>
          <p>La cola muestra las publicaciones enviadas a revisión.</p>
        </div>
      </article>
    </div>

    <section class="card assisted-create">
      <h3>Crear publicación asistida</h3>
      <p v-if="!owners.length" class="notice">
        No hay cuentas OWNER disponibles para crear una publicación asistida.
      </p>
      <form v-else @submit.prevent="assistedCreate">
        <label
          >Owner target<select v-model="form.ownerId" required>
            <option v-for="owner in owners" :key="owner.id" :value="owner.id">
              {{ owner.email }}
            </option>
          </select></label
        >
        <div class="form-row">
          <label
            >Título<input
              v-model="form.title"
              required
              maxlength="120" /></label
          ><label
            >Ubicación<input v-model="form.location" required maxlength="240"
          /></label>
        </div>
        <label
          >Descripción<textarea
            v-model="form.description"
            required
            maxlength="5000"
            rows="3"
          ></textarea>
        </label>
        <div class="form-row">
          <label
            >Precio<input
              v-model.number="form.pricePerNight"
              required
              type="number"
              min="0" /></label
          ><label
            >Huéspedes<input
              v-model.number="form.maxGuests"
              required
              type="number"
              min="1"
          /></label>
        </div>
        <button type="submit" :disabled="!!busy">
          {{ busy === 'assisted' ? 'Creando…' : 'Crear borrador asistido' }}
        </button>
      </form>
    </section>
    <section class="card audit">
      <div class="status-line">
        <h3>Auditoría visible</h3>
        <button
          class="secondary"
          type="button"
          :disabled="auditLoading"
          @click="loadAudit(selected?.id)"
        >
          Actualizar
        </button>
      </div>
      <p v-if="auditLoading" role="status">Cargando auditoría…</p>
      <p v-else-if="!audits.length" role="status">
        No hay eventos para mostrar.
      </p>
      <div v-else class="audit-list">
        <article v-for="entry in audits" :key="entry.id">
          <strong>{{ entry.action }}</strong
          ><span
            >{{ entry.actor.email }} →
            {{ entry.targetOwner?.email || 'sin owner target' }}</span
          ><time :datetime="entry.createdAt">{{
            new Date(entry.createdAt).toLocaleString('es-AR')
          }}</time
          ><small v-if="metadata(entry.metadata)"
            >Metadata: {{ metadata(entry.metadata) }}</small
          ><span>Listing: {{ entry.listingId || entry.entityId || '—' }}</span>
        </article>
      </div>
    </section>
  </section>
</template>
