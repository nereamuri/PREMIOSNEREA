"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { isValidTokenFormat } from "@/lib/token";

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Guarda (o cambia) la selección de un/a votante para una categoría.
 *
 * Se llama una vez por cada clic en una tarjeta de candidato — no solo al
 * final — para que "retomar la votación" funcione de verdad. Válida en el
 * servidor, no solo en la UI:
 *   - el token tiene formato de UUID antes de tocar la base de datos
 *   - la sesión existe
 *   - la sesión NO está enviada (submitted es inmutable)
 *   - el candidato pertenece realmente a esa categoría, y esa categoría al
 *     mismo evento de la sesión (evita manipular el body para votar en
 *     categorías/eventos ajenos)
 */
export async function saveSelectionAction(
  token: string,
  categoryId: string,
  candidateId: string
): Promise<ActionResult> {
  if (!isValidTokenFormat(token)) {
    return { ok: false, error: "Enlace de votación no válido." };
  }

  const session = await prisma.votingSession.findUnique({
    where: { token },
    select: {
      id: true,
      status: true,
      participant: { select: { eventId: true } },
    },
  });

  if (!session) {
    return { ok: false, error: "Esta sesión de votación no existe." };
  }

  if (session.status === "submitted") {
    return {
      ok: false,
      error: "Esta votación ya se ha enviado y no se puede modificar.",
    };
  }

  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    select: { categoryId: true, category: { select: { eventId: true } } },
  });

  const belongsToCategory = candidate?.categoryId === categoryId;
  const belongsToSameEvent =
    candidate?.category.eventId === session.participant.eventId;

  if (!candidate || !belongsToCategory || !belongsToSameEvent) {
    return { ok: false, error: "Candidato o categoría no válidos." };
  }

  await prisma.$transaction([
    prisma.voteSelection.upsert({
      where: {
        votingSessionId_categoryId: {
          votingSessionId: session.id,
          categoryId,
        },
      },
      update: { candidateId },
      create: { votingSessionId: session.id, categoryId, candidateId },
    }),
    ...(session.status === "pending"
      ? [
          prisma.votingSession.update({
            where: { id: session.id },
            data: { status: "in_progress" as const },
          }),
        ]
      : []),
  ]);

  revalidatePath(`/v/${token}`);
  return { ok: true };
}

/**
 * Marca la sesión como enviada (submitted). A partir de aquí es inmutable:
 * saveSelectionAction ya rechaza cualquier escritura posterior porque
 * comprueba session.status === "submitted" en el servidor, no solo aquí.
 *
 * Exige que todas las categorías del evento tengan selección — si falta
 * alguna (por ejemplo, manipulando el cliente para saltarse el resumen),
 * se rechaza en vez de aceptar un envío incompleto.
 */
export async function submitVoteAction(token: string): Promise<ActionResult> {
  if (!isValidTokenFormat(token)) {
    return { ok: false, error: "Enlace de votación no válido." };
  }

  const session = await prisma.votingSession.findUnique({
    where: { token },
    select: {
      id: true,
      status: true,
      participant: {
        select: { event: { select: { categories: { select: { id: true } } } } },
      },
      selections: { select: { categoryId: true } },
    },
  });

  if (!session) {
    return { ok: false, error: "Esta sesión de votación no existe." };
  }

  if (session.status === "submitted") {
    return {
      ok: false,
      error: "Esta votación ya se ha enviado y no se puede modificar.",
    };
  }

  const totalCategories = session.participant.event.categories.length;
  if (session.selections.length < totalCategories) {
    return {
      ok: false,
      error: "Faltan categorías por completar antes de poder enviar.",
    };
  }

  await prisma.votingSession.update({
    where: { id: session.id },
    data: { status: "submitted", submittedAt: new Date() },
  });

  revalidatePath(`/v/${token}`);
  return { ok: true };
}
