<template>
  <a class="skip-link" href="#main-content">Saltar al contenido</a>
  <header class="site-header">
    <p class="eyebrow">Fundación I01</p>
    <h1>Alquileres Uspallata</h1>
  </header>
  <main id="main-content" tabindex="-1">
    <section class="status-card" aria-labelledby="status-title">
      <p id="status-title" class="status-label">Estado</p>
      <p class="status-value" role="status" aria-live="polite">
        Foundation lista
      </p>
      <p class="status-copy">
        Autenticación y roles OWNER/ADMIN preparados para los flujos de la API.
      </p>
    </section>
  </main>
  <footer>I09 QA · entorno local</footer>
</template>

<style>
:root {
  color: #17324d;
  background: #f4f7fa;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}
* {
  box-sizing: border-box;
}
body {
  margin: 0;
  min-width: 320px;
}
.skip-link {
  position: absolute;
  left: -9999px;
  padding: 0.75rem 1rem;
  background: #fff;
  color: #17324d;
}
.skip-link:focus {
  left: 1rem;
  top: 1rem;
  z-index: 1;
  outline: 3px solid #e08b2f;
}
.site-header,
main,
footer {
  width: min(100% - 2rem, 60rem);
  margin-inline: auto;
}
.site-header {
  padding: clamp(3rem, 10vw, 7rem) 0 2rem;
}
.eyebrow,
.status-label {
  color: #8b4f12;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
h1 {
  max-width: 12ch;
  margin: 0.5rem 0 0;
  font-size: clamp(2.25rem, 8vw, 5rem);
  line-height: 0.98;
}
.status-card {
  max-width: 42rem;
  padding: clamp(1.25rem, 4vw, 2rem);
  border: 1px solid #c9d5df;
  border-radius: 1rem;
  background: #fff;
  box-shadow: 0 1rem 3rem rgb(23 50 77 / 10%);
}
.status-label {
  margin: 0;
}
.status-value {
  margin: 0.5rem 0;
  font-size: clamp(1.25rem, 4vw, 2rem);
  font-weight: 700;
}
.status-copy {
  max-width: 52ch;
  margin: 0;
  color: #40566b;
  line-height: 1.6;
}
main {
  min-height: 40vh;
}
footer {
  padding: 3rem 0 2rem;
  color: #40566b;
  font-size: 0.875rem;
}
@media (min-width: 48rem) {
  .site-header,
  main,
  footer {
    width: min(100% - 4rem, 60rem);
  }
}
</style>
