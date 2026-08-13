<script setup lang="ts">
const foundation = [
  'Catálogo público sin cuenta',
  'Autoservicio para propietarios',
  'Revisión inicial por administración',
  'Disponibilidad con última confirmación',
];
</script>

<template>
  <main class="shell">
    <section class="card">
      <p class="eyebrow">Uspallata · Mendoza</p>
      <h1>Alquileres Uspallata</h1>
      <p class="lead">Base técnica I01 preparada para construir el primer thin slice.</p>
      <ul>
        <li v-for="item in foundation" :key="item">{{ item }}</li>
      </ul>
    </section>
  </main>
</template>
