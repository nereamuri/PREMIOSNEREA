import fs from "node:fs";
import path from "node:path";
import * as z from "zod";

// Esquema de validación de la configuración de un evento.
// Cualquier nuevo evento se define creando una carpeta en /config/events/{slug}
// con un event.json y un categories.json que cumplan estos esquemas —
// sin tocar código.
//
// Nota: usamos la sintaxis de Zod 4 (funciones de nivel superior como
// z.iso.datetime() en vez de z.string().datetime(), que en v4 queda
// deprecada aunque siga funcionando).
const EventConfigSchema = z.object({
  slug: z.string(),
  name: z.string(),
  description: z.string().optional(),
  colorPrimary: z.string().optional(),
  colorAccent: z.string().optional(),
  logoUrl: z.string().optional(),
  votingOpensAt: z.iso.datetime().optional(),
  votingClosesAt: z.iso.datetime().optional(),
  rules: z
    .object({
      allowChangeBeforeSubmit: z.boolean().default(true),
      hideResultsUntilClose: z.boolean().default(true),
    })
    .optional(),
});

const CategoryConfigSchema = z.object({
  order: z.number().int().nonnegative(),
  name: z.string(),
  description: z.string().optional(),
});

const CategoriesConfigSchema = z.array(CategoryConfigSchema);

export type EventConfig = z.infer<typeof EventConfigSchema>;
export type CategoryConfig = z.infer<typeof CategoryConfigSchema>;

function eventConfigDir(slug: string) {
  return path.join(process.cwd(), "config", "events", slug);
}

export function loadEventConfig(slug: string): EventConfig {
  const configPath = path.join(eventConfigDir(slug), "event.json");

  if (!fs.existsSync(configPath)) {
    throw new Error(`No se encontró configuración para el evento "${slug}"`);
  }

  const raw = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  return EventConfigSchema.parse(raw);
}

export function loadCategoriesConfig(slug: string): CategoryConfig[] {
  const configPath = path.join(eventConfigDir(slug), "categories.json");

  if (!fs.existsSync(configPath)) {
    throw new Error(
      `No se encontró categories.json para el evento "${slug}"`
    );
  }

  const raw = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  return CategoriesConfigSchema.parse(raw);
}
