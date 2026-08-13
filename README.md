# Alquileres Uspallata

Plataforma hiperlocal para descubrir y mantener oferta vigente de alquileres de media y larga estancia en Uspallata.

## Estado

BUILD — I01 foundation.

La primera versión prioriza:

- búsqueda pública sin cuenta;
- autoservicio para propietarios;
- revisión inicial por administración;
- disponibilidad y última confirmación visibles;
- contacto directo;
- sin pagos, reservas ni contratos internos.

## Stack aprobado

- Vue 3 + Vite
- NestJS
- Prisma + PostgreSQL
- pnpm workspace
- API REST
- object storage para imágenes en incrementos posteriores

## Desarrollo local

Requisitos: Node.js 22+, pnpm y Docker.

```bash
cp .env.example .env
docker compose up -d db
pnpm install
pnpm --filter @alquileres/api prisma:generate
pnpm --filter @alquileres/api prisma:migrate
pnpm dev
```

Web: `http://localhost:5173`

API: `http://localhost:3000/api`

Health: `http://localhost:3000/api/health`

## Documentación

El estado técnico resumido para handoff vive en `docs/canonical/HANDOFF-001.md`.
