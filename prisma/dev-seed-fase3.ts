/**
 * DATOS DE PRUEBA DESECHABLES — solo para probar el flujo de voto (Fase 3)
 * en local antes de que exista el panel de administración (Fase 4).
 *
 * A diferencia de seed.ts (que sí es parte del proyecto real y solo crea
 * Event + Categories a partir de /config), este script crea candidatos
 * placeholder y una sesión de voto de prueba con un token fijo y conocido.
 * No lo ejecutes contra una base de datos de producción.
 *
 * Uso: npx tsx prisma/dev-seed-fase3.ts
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const TEST_TOKEN = "00000000-0000-4000-8000-000000000001";
const TEST_EMAIL = "prueba@premiosnerea.local";

const CANDIDATE_NAMES = [
  { name: "Ana Torres", department: "Marketing" },
  { name: "Luis Ramírez", department: "Producto" },
  { name: "Sara Gómez", department: "Operaciones" },
];

async function main() {
  const slug = process.env.NEXT_PUBLIC_ACTIVE_EVENT_SLUG ?? "premios-nerea";

  const event = await prisma.event.findUnique({
    where: { slug },
    include: { categories: { include: { candidates: true } } },
  });

  if (!event) {
    throw new Error(
      `No existe el evento "${slug}". Ejecuta primero "npm run db:seed".`
    );
  }

  for (const category of event.categories) {
    if (category.candidates.length > 0) continue;

    await prisma.candidate.createMany({
      data: CANDIDATE_NAMES.map((c) => ({
        categoryId: category.id,
        name: c.name,
        department: c.department,
      })),
    });
  }

  const participant = await prisma.participant.upsert({
    where: { eventId_email: { eventId: event.id, email: TEST_EMAIL } },
    update: {},
    create: {
      eventId: event.id,
      name: "Participante de prueba",
      email: TEST_EMAIL,
      department: "Pruebas",
    },
  });

  const session = await prisma.votingSession.upsert({
    where: { participantId: participant.id },
    update: {},
    create: { participantId: participant.id, token: TEST_TOKEN },
  });

  console.log("Candidatos de prueba creados (3 por categoría, si no había).");
  console.log(`Participante de prueba: ${participant.email}`);
  console.log(`Token de prueba: ${session.token}`);
  console.log(`Prueba el flujo en: http://localhost:3000/v/${session.token}`);
}

main()
  .catch((err) => {
    console.error("Error en dev-seed-fase3:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
