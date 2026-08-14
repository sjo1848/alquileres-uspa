<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useSession } from './session';

const router = useRouter();
const session = useSession();

onMounted(() => {
  if (session.status.value === 'unknown') {
    void restoreSession();
  }
});

async function restoreSession() {
  try {
    await session.restore();
  } catch {
    // The visible error state below provides the recovery actions.
  }
}

function goToLogin() {
  session.anonymous();
  void router.push('/auth/login');
}
</script>

<template>
  <a class="skip-link" href="#main-content">Saltar al contenido</a>
  <header><h1>Alquileres Uspallata</h1></header>
  <main id="main-content" tabindex="-1">
    <section
      v-if="session.status.value === 'loading'"
      class="card session-state"
      aria-live="polite"
      aria-busy="true"
    >
      <p class="eyebrow">Sesión</p>
      <h2>Verificando tu sesión…</h2>
      <p>Esperá un momento mientras preparamos la aplicación.</p>
    </section>
    <section
      v-else-if="session.status.value === 'error'"
      class="card session-state"
      role="alert"
    >
      <p class="eyebrow">Sesión</p>
      <h2>No pudimos verificar tu sesión</h2>
      <p>Podés reintentar o volver al inicio de sesión para continuar.</p>
      <div class="session-actions">
        <button type="button" @click="restoreSession">Reintentar</button>
        <button type="button" class="secondary" @click="goToLogin">
          Volver al inicio de sesión
        </button>
      </div>
    </section>
    <RouterView v-else />
  </main>
  <footer>Entorno local · R1</footer>
</template>
