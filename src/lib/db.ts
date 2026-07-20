import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Evita crear múltiples instancias de PrismaClient en desarrollo
// (Next.js recarga módulos en caliente).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Conexión pooled (pgbouncer) para las queries normales de la app.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
