<script setup lang="ts">
import { ref } from 'vue';

const apiStatus = ref('Foundation lista');
</script>

<template>
  <main>
    <h1>Alquileres Uspallata</h1>
    <p>{{ apiStatus }}</p>
    <p>I01: foundation de autenticación y roles OWNER/ADMIN.</p>
  </main>
</template>
