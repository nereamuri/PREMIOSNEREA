# Premios Nerea

Plataforma de votación de premios internos. Ver `PRD-Premios-Nerea.md` y
`Specs-por-Fase.md` para el contexto completo de producto y el plan de fases.

## Stack (verificado julio 2026)

- **Next.js 16** (App Router) + TypeScript + React 19 — Turbopack es el
  bundler por defecto en dev y build, no requiere flags adicionales.
- **Tailwind CSS v4** — configuración CSS-first (`@theme` en `globals.css`),
  ya no usa `tailwind.config.ts` ni `autoprefixer`.
- **Supabase** (Postgres + Storage) vía **Prisma 7** (cliente sin binarios
  Rust desde la v7).
- **Motion** (antes "Framer Motion" — el paquete se renombró; se importa
  desde `motion/react`) para animaciones.
- Microsoft Graph API (Teams, Outlook, OneDrive) — Fase 5.
- **Vitest** para tests unitarios.

## Requisitos

- **Node.js 24** (LTS activa). El proyecto fija `engines.node >= 22` como
  mínimo porque el cliente de `@supabase/supabase-js` ya no soporta Node 20
  (EOL abril 2026), pero se recomienda 24 para nuevos proyectos. Si usas
  `nvm`, `nvm use` respeta el `.nvmrc` incluido.
- Una cuenta y proyecto creados en [supabase.com](https://supabase.com).

## Puesta en marcha local

Funciona igual con **Visual Studio Code** o **Claude Code**; no hay
dependencias específicas de un IDE.

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env.local
```
Rellena `.env.local` con las credenciales de tu proyecto de Supabase
(Project Settings → Database, y Project Settings → API).

### 3. Aplicar el modelo de datos
```bash
npm run prisma:generate
npm run prisma:migrate
```
Esto crea las tablas (`events`, `categories`, `candidates`, `participants`,
`voting_sessions`, `vote_selections`) en tu base de datos de Supabase.

### 4. Cargar el evento y las categorías de ejemplo
```bash
npm run db:seed
```
Lee `config/events/premios-nerea/{event,categories}.json` y crea (o
actualiza) ese evento en base de datos. Es idempotente: puedes volver a
ejecutarlo tras editar los JSON sin duplicar nada.

### 5. Arrancar en desarrollo
```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000).

- Flujo de voto (placeholder de Fase 3): `/v/[token]`
- Panel de admin (placeholder de Fase 4): `/admin/dashboard`

### 6. Tests y calidad
```bash
npm run test        # tests unitarios (Vitest)
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
```
El workflow en `.github/workflows/ci.yml` corre estos tres pasos
automáticamente en cada push/PR a `main`.

## Configuración de eventos sin tocar código

Cada evento vive en `config/events/{slug}/`:
- `event.json` — nombre, fechas, colores, logo, reglas
- `categories.json` — categorías del evento

El evento activo se selecciona con `NEXT_PUBLIC_ACTIVE_EVENT_SLUG` en
`.env.local`. `npm run db:seed` es lo que traduce esos JSON a filas reales
en base de datos.

## Notas de seguridad

- **Prisma se conecta con el rol directo de Postgres de Supabase**, lo cual
  **no pasa por Row Level Security**. Toda la lógica de "quién puede
  escribir qué" (p. ej. que un voto ya enviado no pueda modificarse) vive en
  `src/server/services`, no en la base de datos. No asumas que RLS protege
  nada de lo que toca Prisma.
- El único dato que se lee directamente desde el navegador contra Supabase
  es el **Storage de fotos de candidatos**, con la clave `anon`. Las
  políticas de ese bucket están documentadas (y listas para copiar/pegar)
  en `supabase/policies/storage-candidate-photos.sql`.
- `SUPABASE_SERVICE_ROLE_KEY` nunca debe exponerse al cliente ni importarse
  fuera de código de servidor — ver los comentarios en `src/lib/supabase.ts`.

## Estado actual

Este es el **esqueleto técnico** del proyecto (estructura de carpetas,
schema de base de datos, seed, tests, CI, configuración base). Cada fase
del `Specs-por-Fase.md` se implementa de forma incremental sobre esta base,
con tu validación entre fase y fase.
