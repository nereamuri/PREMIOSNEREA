// Desde Prisma 7, el CLI ya no carga variables de entorno de .env por su
// cuenta (antes sí lo hacía). Este archivo sustituye a esa carga automática
// y es el punto central de configuración del CLI (antes repartido entre
// schema.prisma y flags de comando).
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
