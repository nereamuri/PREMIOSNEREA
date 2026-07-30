"use client";

import { useState, useTransition } from "react";
import {
  getResultsEmailPreviewAction,
  sendResultsEmailAction,
  type BulkEmailResult,
} from "@/server/actions/admin/results-email";
import { EmailPreviewModal } from "../email-preview-modal";

type Feedback = { sent: number; failed: number; errors: string[] } | { error: string };

export function SendResultsEmailButton({ eventId }: { eventId: string }) {
  const [isPending, startTransition] = useTransition();
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  async function openPreview() {
    setIsLoadingPreview(true);
    const html = await getResultsEmailPreviewAction(eventId);
    setPreviewHtml(html);
    setIsLoadingPreview(false);
  }

  function confirmSend() {
    setFeedback(null);
    startTransition(async () => {
      const res: BulkEmailResult = await sendResultsEmailAction(eventId);
      setFeedback(!res.ok ? { error: res.error } : { sent: res.sent, failed: res.failed, errors: res.errors });
      setPreviewHtml(null);
    });
  }

  return (
    <>
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
        </div>
      )}

      <button
        type="button"
        disabled={isLoadingPreview}
        onClick={openPreview}
        className="inline-block rounded-full border-2 border-ink px-6 py-2.5 font-display font-bold disabled:opacity-40"
      >
        {isLoadingPreview ? "Preparando…" : "Enviar mail de resultados"}
      </button>

      {previewHtml && (
        <EmailPreviewModal
          title="Email de resultados — previsualización"
          html={previewHtml}
          isSending={isPending}
          onConfirm={confirmSend}
          onCancel={() => setPreviewHtml(null)}
        />
      )}
    </>
  );
}
