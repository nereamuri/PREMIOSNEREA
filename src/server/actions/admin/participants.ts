"use server";

import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { generateVotingToken } from "@/lib/token";
import {
  deleteParticipantPhoto,
  uploadParticipantPhoto,
  validateParticipantPhoto,
} from "@/server/services/storage";

export type ActionResult = { ok: true } | { ok: false; error: string };
export type ImportResult =
  | { ok: true; created: number; skipped: number; errors: string[] }
  | { ok: false; error: string };

function readPhoto(formData: FormData): File | null {
  const photo = formData.get("photo");
  return photo instanceof File && photo.size > 0 ? photo : null;
}

export async function createParticipantAction(
  eventId: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const name = ((formData.get("name") as string) ?? "").trim();
  const email = ((formData.get("email") as string) ?? "").trim().toLowerCase();
  const department = ((formData.get("department") as string) ?? "").trim();
  const photo = readPhoto(formData);

  if (!name) return { ok: false, error: "El nombre es obligatorio." };
  if (!email) return { ok: false, error: "El email es obligatorio." };

  if (photo) {
    const validationError = validateParticipantPhoto(photo);
    if (validationError) return { ok: false, error: validationError };
  }

  let participant;
  try {
    participant = await prisma.participant.create({
      data: { eventId, name, email, department: department || null },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, error: "Ya existe un participante con ese email." };
    }
    throw err;
  }

  await prisma.votingSession.create({
    data: { participantId: participant.id, token: generateVotingToken() },
  });

  if (photo) {
    try {
      const photoUrl = await uploadParticipantPhoto(participant.id, photo);
      await prisma.participant.update({
        where: { id: participant.id },
        data: { photoUrl },
      });
    } catch (err) {
      return {
        ok: false,
        error:
          err instanceof Error
            ? `Participante creado, pero ${err.message}`
            : "Participante creado, pero falló la subida de la foto.",
      };
    }
  }

  revalidatePath("/admin/participantes");
  return { ok: true };
}

export async function updateParticipantAction(
  participantId: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const name = ((formData.get("name") as string) ?? "").trim();
  const email = ((formData.get("email") as string) ?? "").trim().toLowerCase();
  const department = ((formData.get("department") as string) ?? "").trim();
  const photo = readPhoto(formData);

  if (!name) return { ok: false, error: "El nombre es obligatorio." };
  if (!email) return { ok: false, error: "El email es obligatorio." };

  if (photo) {
    const validationError = validateParticipantPhoto(photo);
    if (validationError) return { ok: false, error: validationError };
  }

  const data: {
    name: string;
    email: string;
    department: string | null;
    photoUrl?: string;
  } = { name, email, department: department || null };

  if (photo) {
    try {
      data.photoUrl = await uploadParticipantPhoto(participantId, photo);
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Falló la subida de la foto.",
      };
    }
  }

  try {
    await prisma.participant.update({ where: { id: participantId }, data });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, error: "Ya existe otro participante con ese email." };
    }
    throw err;
  }

  revalidatePath("/admin/participantes");
  return { ok: true };
}

/**
 * Si el participante ya empezó o envió su votación (status distinto de
 * "pending"), se rechaza el borrado en servidor para no destruir votos
 * reales — igual que con categorías y candidatos.
 */
export async function deleteParticipantAction(
  participantId: string
): Promise<ActionResult> {
  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    select: { votingSession: { select: { status: true } } },
  });

  if (!participant) {
    return { ok: false, error: "El participante no existe." };
  }

  if (participant.votingSession && participant.votingSession.status !== "pending") {
    return {
      ok: false,
      error:
        participant.votingSession.status === "submitted"
          ? "Este participante ya envió su votación y no se puede eliminar."
          : "Este participante ya empezó a votar y no se puede eliminar.",
    };
  }

  await deleteParticipantPhoto(participantId);
  await prisma.participant.delete({ where: { id: participantId } });

  revalidatePath("/admin/participantes");
  return { ok: true };
}

type ImportRow = { name: string; email: string; department: string | null };

/** Busca la columna por nombre sin distinguir mayúsculas/acentos. */
function findColumn(
  row: Record<string, unknown>,
  candidates: string[]
): string | null {
  const normalize = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .trim()
      .toLowerCase();
  const keys = Object.keys(row);
  for (const candidate of candidates) {
    const key = keys.find((k) => normalize(k) === normalize(candidate));
    if (key && row[key] != null && String(row[key]).trim() !== "") {
      return String(row[key]).trim();
    }
  }
  return null;
}

function parseParticipantsExcel(buffer: ArrayBuffer): {
  rows: ImportRow[];
  errors: string[];
} {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  const rows: ImportRow[] = [];
  const errors: string[] = [];

  raw.forEach((record, i) => {
    const name = findColumn(record, ["Nombre", "Name"]);
    const email = findColumn(record, ["Email", "Correo", "Correo electrónico"]);
    const department = findColumn(record, ["Departamento", "Department"]);

    if (!name || !email) {
      errors.push(`Fila ${i + 2}: falta nombre o email, se ha saltado.`);
      return;
    }
    rows.push({ name, email: email.toLowerCase(), department });
  });

  return { rows, errors };
}

/**
 * Importa participantes desde un Excel con columnas Nombre / Email /
 * Departamento (opcional). Cada fila válida crea un participante y su
 * sesión de voto; los emails que ya existen en el evento se cuentan como
 * "saltados" en vez de fallar toda la importación.
 */
export async function importParticipantsExcelAction(
  eventId: string,
  _prev: ImportResult,
  formData: FormData
): Promise<ImportResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Selecciona un archivo Excel." };
  }

  const buffer = await file.arrayBuffer();
  let parsed: { rows: ImportRow[]; errors: string[] };
  try {
    parsed = parseParticipantsExcel(buffer);
  } catch {
    return { ok: false, error: "No se pudo leer el archivo. ¿Es un .xlsx válido?" };
  }

  const { rows, errors } = parsed;
  let created = 0;
  let skipped = 0;

  for (const row of rows) {
    try {
      const participant = await prisma.participant.create({
        data: {
          eventId,
          name: row.name,
          email: row.email,
          department: row.department,
        },
      });
      await prisma.votingSession.create({
        data: { participantId: participant.id, token: generateVotingToken() },
      });
      created++;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        skipped++;
      } else {
        errors.push(`${row.email}: error al crearlo.`);
      }
    }
  }

  revalidatePath("/admin/participantes");
  return { ok: true, created, skipped, errors };
}
