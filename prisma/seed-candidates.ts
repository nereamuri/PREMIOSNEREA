/**
 * Carga (o actualiza) el roster real de candidatos: cada persona de PEOPLE
 * se presenta en TODAS las categorías del evento (no hay candidatos
 * distintos por categoría en este evento).
 *
 * Idempotente: si ya existe un candidato con ese nombre en una categoría,
 * se actualiza su foto si ha cambiado en vez de duplicarlo. Vuelve a
 * ejecutarse sin problema cuando se añada gente nueva a PEOPLE.
 *
 * Antes de crear el roster real, borra los candidatos de prueba de Fase 3
 * (Ana Torres / Luis Ramírez / Sara Gómez) de cada categoría — pero solo
 * si no tienen votos reales asociados; si alguno los tiene, se deja y se
 * avisa en vez de borrarlo.
 *
 * Uso: npx tsx prisma/seed-candidates.ts
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { deleteCandidatePhoto } from "../src/server/services/storage";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PHOTO_BASE_URL = `${SUPABASE_URL}/storage/v1/object/public/candidate-photos`;

const PLACEHOLDER_NAMES = ["Ana Torres", "Luis Ramírez", "Sara Gómez"];

const PEOPLE: { name: string; file: string }[] = [
  { name: "Beatriz Llerena", file: "beatriz-llerena.png" },
  { name: "Cristina Álamo", file: "cristina-alamo.png" },
  { name: "Daniel Llorente", file: "daniel-llorente.png" },
  { name: "Daniel Martín", file: "daniel-martin.png" },
  { name: "David Majan", file: "david-majan.png" },
  { name: "Enric Badenes", file: "enric-badenes.png" },
  { name: "Esther Gutiérrez", file: "esther-gutierrez.jpeg" },
  { name: "Gonzalo Sánchez", file: "gonzalo-sanchez.png" },
  { name: "Irene Arroyo", file: "irene-arroyo.png" },
  { name: "Ismael Barroso", file: "ismael-barroso.png" },
  { name: "Joaquina Egozcue", file: "joaquina-egozcue.png" },
  { name: "Jorge Barriobero", file: "jorge-barriobero.png" },
  { name: "Luis Oviedo", file: "luis-oviedo.png" },
  { name: "María Pastor", file: "maria-pastor.png" },
  { name: "Nacho Hermoso", file: "nacho-hermoso.png" },
  { name: "Nerea Jiménez", file: "nerea-jimenez.png" },
  { name: "Nerea Murillo", file: "nerea-murillo.png" },
  { name: "Pedro Ramos", file: "pedro-ramos.png" },
  { name: "Rubén Ortiz", file: "ruben-ortiz.png" },
  { name: "Teresa Fernández", file: "teresa-fernandez.png" },
];

async function removePlaceholders(categoryId: string) {
  const placeholders = await prisma.candidate.findMany({
    where: { categoryId, name: { in: PLACEHOLDER_NAMES } },
    include: { _count: { select: { selections: true } } },
  });

  for (const candidate of placeholders) {
    if (candidate._count.selections > 0) {
      console.warn(
        `  ! "${candidate.name}" tiene ${candidate._count.selections} voto(s), no se elimina.`
      );
      continue;
    }
    await deleteCandidatePhoto(candidate.id);
    await prisma.candidate.delete({ where: { id: candidate.id } });
  }
}

async function main() {
  const slug = process.env.NEXT_PUBLIC_ACTIVE_EVENT_SLUG ?? "premios-nerea";
  const event = await prisma.event.findUnique({
    where: { slug },
    include: { categories: true },
  });

  if (!event) {
    throw new Error(`No existe el evento "${slug}". Ejecuta "npm run db:seed" primero.`);
  }
  if (event.categories.length === 0) {
    throw new Error("El evento no tiene categorías todavía.");
  }

  let created = 0;
  let updated = 0;

  for (const category of event.categories) {
    console.log(`Categoría: ${category.name}`);
    await removePlaceholders(category.id);

    const existing = await prisma.candidate.findMany({
      where: { categoryId: category.id },
      select: { id: true, name: true, photoUrl: true },
    });
    const existingByName = new Map(existing.map((c) => [c.name, c]));

    for (const person of PEOPLE) {
      const photoUrl = `${PHOTO_BASE_URL}/${person.file}`;
      const match = existingByName.get(person.name);

      if (match) {
        if (match.photoUrl !== photoUrl) {
          await prisma.candidate.update({
            where: { id: match.id },
            data: { photoUrl },
          });
          updated++;
        }
      } else {
        await prisma.candidate.create({
          data: {
            categoryId: category.id,
            name: person.name,
            department: null,
            photoUrl,
          },
        });
        created++;
      }
    }
  }

  console.log(
    `\nListo. Candidatos creados: ${created}. Fotos actualizadas: ${updated}.`
  );
  console.log(
    `Esperado: ${event.categories.length} categorías × ${PEOPLE.length} personas = ${
      event.categories.length * PEOPLE.length
    } candidatos en total.`
  );
}

main()
  .catch((err) => {
    console.error("Error en seed-candidates:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
