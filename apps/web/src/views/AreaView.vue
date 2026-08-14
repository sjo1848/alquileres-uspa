<script setup lang="ts">
import { useSession } from '../session';
const props = defineProps<{ area: 'OWNER' | 'ADMIN' }>();
const session = useSession();
</script>
<template>
  <section class="card">
    <p class="eyebrow">Área {{ props.area }}</p>
    <h2>Próximamente</h2>
    <p>
      La autenticación está lista. Las operaciones de negocio se incorporarán en
      sus fases correspondientes.
    </p>
    <button
      type="button"
      @click="
        session.clear();
        $router.push('/auth/login');
      "
    >
      Cerrar sesión
    </button>
  </section>
</template>
