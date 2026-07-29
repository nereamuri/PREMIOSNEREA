"use client";

export function EmailPreviewModal({
  title,
  html,
  isSending,
  onConfirm,
  onCancel,
}: {
  title: string;
  html: string;
  isSending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-3xl border-[2.5px] border-ink bg-white shadow-sticker-ink">
        <div className="flex items-center justify-between border-b-2 border-ink p-4">
          <h2 className="font-display text-lg font-bold">{title}</h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cerrar"
            className="rounded-full border-2 border-ink px-3 py-1 text-sm font-bold"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-hidden bg-cream">
          <iframe
            title="Previsualización del email"
            srcDoc={html}
            className="h-[60vh] w-full border-0"
          />
        </div>

        <div className="flex justify-end gap-3 border-t-2 border-ink p-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSending}
            className="rounded-full border-2 border-ink px-5 py-2 text-sm font-bold disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSending}
            className="rounded-full bg-ink px-6 py-2 font-display font-bold text-cream shadow-sticker-fuchsia transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-40"
          >
            {isSending ? "Enviando…" : "Confirmar y enviar"}
          </button>
        </div>
      </div>
    </div>
  );
}
