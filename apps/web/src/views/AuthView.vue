<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ApiError } from '../api';
import { useSession } from '../session';
const props = defineProps<{ mode: 'login' | 'register' }>();
const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);
const session = useSession();
const router = useRouter();
const route = useRoute();
async function submit() {
  loading.value = true;
  error.value = '';
  try {
    await session.authenticate(
      props.mode === 'login' ? '/auth/login' : '/auth/register',
      email.value,
      password.value,
    );
    await router.push(session.role.value === 'ADMIN' ? '/admin' : '/owner');
  } catch (e) {
    error.value =
      e instanceof ApiError ? e.message : 'No se pudo completar la operación';
  } finally {
    loading.value = false;
  }
}
</script>
<template>
  <section class="card">
    <p class="eyebrow">
      {{ props.mode === 'login' ? 'Acceso' : 'Registro OWNER' }}
    </p>
    <h2>{{ props.mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta' }}</h2>
    <p v-if="route.query.expired" class="error" role="alert">
      La sesión expiró. Ingresá nuevamente.
    </p>
    <form @submit.prevent="submit">
      <label for="email">Email</label
      ><input
        id="email"
        v-model="email"
        type="email"
        autocomplete="email"
        required
      /><label for="password">Contraseña</label
      ><input
        id="password"
        v-model="password"
        type="password"
        autocomplete="current-password"
        minlength="8"
        required
      />
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <button :disabled="loading" type="submit">
        {{
          loading
            ? 'Procesando…'
            : props.mode === 'login'
              ? 'Ingresar'
              : 'Registrarme'
        }}
      </button>
    </form>
    <RouterLink v-if="props.mode === 'login'" to="/auth/registro"
      >Crear cuenta OWNER</RouterLink
    ><RouterLink v-else to="/auth/login">Ya tengo cuenta</RouterLink>
  </section>
</template>
