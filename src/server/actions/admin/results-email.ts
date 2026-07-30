"use server";

import { prisma } from "@/lib/db";
import { getActiveEvent } from "@/server/services/admin/categories";
import { getCeremonyData } from "@/server/services/admin/ceremony";
import {
  renderResultsPreviewHtml,
  sendResultsEmail,
  type ResultsEmailCategory,
} from "@/server/services/email";

export type BulkEmailResult =
  | { ok: true; sent: number; failed: number; errors: string[] }
  | { ok: false; error: string };

async function getWinnersByCategory(eventId: string): Promise<ResultsEmailCategory[]> {
  const categories = await getCeremonyData(eventId);
  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    winners: category.podium.find((p) => p.rank === 1)?.people ?? [],
  }));
}

/** HTML del email de resultados, para previsualizar antes de enviar. */
export async function getResultsEmailPreviewAction(eventId: string): Promise<string> {
  const event = await prisma.event.findUniqueOrThrow({ where: { id: eventId } });
  const categories = await getWinnersByCategory(eventId);
  return renderResultsPreviewHtml({ eventName: event.name, categories });
}

/** Envía el email de resultados/despedida a todos los participantes del evento. */
export async function sendResultsEmailAction(eventId: string): Promise<BulkEmailResult> {
  const event = await getActiveEvent();
  const categories = await getWinnersByCategory(eventId);
  const participants = await prisma.participant.findMany({ where: { eventId } });

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const participant of participants) {
    try {
      await sendResultsEmail({ to: participant.email, eventName: event.name, categories });
      sent++;
    } catch (err) {
      failed++;
      errors.push(
        `${participant.email}: ${err instanceof Error ? err.message : "error desconocido"}`
      );
    }
  }

  return { ok: true, sent, failed, errors };
}
