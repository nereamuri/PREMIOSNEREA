/**
 * Seed idempotente: lee /config/events/{slug}/event.json y categories.json
 * y crea (o actualiza) ese Event + sus Categories en base de datos.
 *
 * Esto es lo que hace real la promesa del PRD de "evento configurable por
 * JSON sin tocar código": este script es el único puente entre esos
 * archivos y la base de datos. No crea participantes ni candidatos (eso
 * se gestiona desde el panel de admin en la Fase 4, con fotos incluidas,
 * que no tiene sentido modelar en JSON plano).
 *
 * Uso:
 *   npm run db:seed
 *   (o automáticamente tras `prisma migrate dev`, según prisma.config.ts)
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  loadEventConfig,
  loadCategoriesConfig,
} from "../src/lib/config/event-config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const slug = process.env.NEXT_PUBLIC_ACTIVE_EVENT_SLUG ?? "premios-nerea";

  const eventConfig = loadEventConfig(slug);
  const categoriesConfig = loadCategoriesConfig(slug);

  const event = await prisma.event.upsert({
    where: { slug: eventConfig.slug },
    update: {
      name: eventConfig.name,
      description: eventConfig.description,
      colorPrimary: eventConfig.colorPrimary,
      colorAccent: eventConfig.colorAccent,
      logoUrl: eventConfig.logoUrl,
      votingOpensAt: eventConfig.votingOpensAt
        ? new Date(eventConfig.votingOpensAt)
        : null,
      votingClosesAt: eventConfig.votingClosesAt
        ? new Date(eventConfig.votingClosesAt)
        : null,
    },
    create: {
      slug: eventConfig.slug,
      name: eventConfig.name,
      description: eventConfig.description,
      colorPrimary: eventConfig.colorPrimary,
      colorAccent: eventConfig.colorAccent,
      logoUrl: eventConfig.logoUrl,
      votingOpensAt: eventConfig.votingOpensAt
        ? new Date(eventConfig.votingOpensAt)
        : null,
      votingClosesAt: eventConfig.votingClosesAt
        ? new Date(eventConfig.votingClosesAt)
        : null,
    },
  });

  console.log(`Evento "${event.name}" (${event.slug}) creado/actualizado.`);

  for (const cat of categoriesConfig) {
    const existing = await prisma.category.findFirst({
      where: { eventId: event.id, name: cat.name },
    });

    if (existing) {
      await prisma.category.update({
        where: { id: existing.id },
        data: { description: cat.description, order: cat.order },
      });
    } else {
      await prisma.category.create({
        data: {
          eventId: event.id,
          name: cat.name,
          description: cat.description,
          order: cat.order,
        },
      });
    }
  }

  console.log(`${categoriesConfig.length} categorías sincronizadas.`);
}

main()
  .catch((err) => {
    console.error("Error al hacer seed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
