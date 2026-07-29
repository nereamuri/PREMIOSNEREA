"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  sendVotingInvitationEmail,
  renderInvitationPreviewHtml,
} from "@/server/services/email";
import type { Prisma } from "@/generated/prisma/client";

export type ActionResult = { ok: true } | { ok: false; error: string };
export type BulkEmailResult =
  | { ok: true; sent: number; failed: number; errors: string[] }
  | { ok: false; error: string };

function buildVotingLink(token: string): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return `${siteUrl}/v/${token}`;
}

type ParticipantWithSession = Prisma.ParticipantGetPayload<{
  include: { event: true; votingSession: true };
}>;

async function sendToParticipants(
  participants: ParticipantWithSession[],
  isReminder: boolean
): Promise<BulkEmailResult> {
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const participant of participants) {
    if (!participant.votingSession) continue;
    try {
      await sendVotingInvitationEmail({
        to: participant.email,
        participantName: participant.name,
        eventName: participant.event.name,
        eventDescription: participant.event.description,
        votingLink: buildVotingLink(participant.votingSession.token),
        opensAt: participant.event.votingOpensAt,
        closesAt: participant.event.votingClosesAt,
        isReminder,
      });
      sent++;
    } catch (err) {
      failed++;
      errors.push(
        `${participant.email}: ${err instanceof Error ? err.message : "error desconocido"}`
      );
    }
  }

  revalidatePath("/admin/participantes");
  return { ok: true, sent, failed, errors };
}

/**
 * El texto del email (invitación vs recordatorio) para el envío individual
 * se decide según el estado de la sesión de voto: "pending" -> invitación,
 * "in_progress" -> recordatorio. A alguien que ya envió su voto
 * ("submitted") no se le deja enviar nada.
 */
export async function sendInvitationEmailAction(
  participantId: string
): Promise<ActionResult> {
  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    include: { event: true, votingSession: true },
  });

  if (!participant) {
    return { ok: false, error: "El participante no existe." };
  }
  if (!participant.votingSession) {
    return { ok: false, error: "Este participante no tiene sesión de voto." };
  }
  if (participant.votingSession.status === "submitted") {
    return { ok: false, error: "Este participante ya ha votado." };
  }

  const result = await sendToParticipants(
    [participant],
    participant.votingSession.status === "in_progress"
  );

  if (!result.ok) return result;
  if (result.failed > 0) {
    return { ok: false, error: result.errors[0] ?? "No se pudo enviar el email." };
  }
  return { ok: true };
}

/** Primer envío: invitación a TODOS los participantes del evento, sin importar su estado. */
export async function sendBulkInvitationsAction(
  eventId: string
): Promise<BulkEmailResult> {
  const participants = await prisma.participant.findMany({
    where: { eventId, votingSession: { isNot: null } },
    include: { event: true, votingSession: true },
  });
  return sendToParticipants(participants, false);
}

/** Recordatorio: solo a quien todavía no ha enviado su voto. */
export async function sendBulkRemindersAction(
  eventId: string
): Promise<BulkEmailResult> {
  const participants = await prisma.participant.findMany({
    where: { eventId, votingSession: { status: { not: "submitted" } } },
    include: { event: true, votingSession: true },
  });
  return sendToParticipants(participants, true);
}

/** HTML del email de invitación/recordatorio, para previsualizar antes de enviar. */
export async function getInvitationEmailPreviewAction(
  eventId: string,
  isReminder: boolean
): Promise<string> {
  const event = await prisma.event.findUniqueOrThrow({ where: { id: eventId } });

  return renderInvitationPreviewHtml({
    participantName: "Nombre Apellido",
    eventName: event.name,
    eventDescription: event.description,
    votingLink: "#",
    opensAt: event.votingOpensAt,
    closesAt: event.votingClosesAt,
    isReminder,
  });
}
