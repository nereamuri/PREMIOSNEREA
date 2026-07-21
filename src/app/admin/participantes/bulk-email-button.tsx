"use client";

import { useState, useTransition } from "react";
import {
  sendBulkInvitationsAction,
  sendBulkRemindersAction,
  type BulkEmailResult,
} from "@/server/actions/admin/email";

type Feedback = { sent: number; failed: number; errors: string[] } | { error: string };

export function BulkEmailButton({ eventId }: { eventId: string }) {
  const [isPending, startTransition] = useTransition();
  const [pendingKind, setPendingKind] = useState<"invite" | "remind" | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  function runBulkAction(
    kind: "invite" | "remind",
    confirmMessage: string,
    action: (eventId: string) => Promise<BulkEmailResult>
  ) {
    if (!window.confirm(confirmMessage)) return;
    setFeedback(null);
    setPendingKind(kind);
    startTransition(async () => {
      const res = await action(eventId);
      setFeedback(!res.ok ? { error: res.error } : { sent: res.sent, failed: res.failed, errors: res.errors });
      setPendingKind(null);
    });
  }

  return (
    <div className="rounded-3xl border-[2.5px] border-ink bg-white p-6 shadow-sticker-ink">
      <h2 className="font-display text-lg font-bold">Enviar por email</h2>
      <p className="mt-1 text-neutral-400">
        Primero manda la invitación a todo el mundo. Más adelante, usa el
        recordatorio para quienes todavía no hayan votado.
      </p>

      {feedback && "error" in feedback && (
        <p className="mt-3 rounded-full border-2 border-ink bg-cream px-4 py-2 text-sm">
          {feedback.error}
        </p>
      )}
      {feedback && "sent" in feedback && (
        <div className="mt-3 rounded-2xl border-2 border-ink bg-cream p-4 text-sm">
          <p>
            {feedback.sent} enviado(s)
            {feedback.failed > 0 && `, ${feedback.failed} fallido(s)`}.
          </p>
          {feedback.errors.length > 0 && (
            <ul className="mt-2 list-disc pl-5">
              {feedback.errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            runBulkAction(
              "invite",
              "¿Enviar la invitación por email a TODOS los participantes? Úsalo la primera vez.",
              sendBulkInvitationsAction
            )
          }
          className="rounded-full bg-ink px-6 py-2.5 font-display font-bold text-cream shadow-sticker-fuchsia transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-40"
        >
          {pendingKind === "invite" ? "Enviando…" : "1. Enviar invitación a todos"}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            runBulkAction(
              "remind",
              "¿Enviar un recordatorio a todos los que todavía no han enviado su voto?",
              sendBulkRemindersAction
            )
          }
          className="rounded-full border-2 border-ink px-6 py-2.5 font-display font-bold disabled:opacity-40"
        >
          {pendingKind === "remind" ? "Enviando…" : "2. Enviar recordatorio a quien falte"}
        </button>
      </div>
    </div>
  );
}
