"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import {
  importParticipantsExcelAction,
  type ImportResult,
} from "@/server/actions/admin/participants";

const initialState: ImportResult = { ok: true, created: 0, skipped: 0, errors: [] };

export function ImportParticipantsForm({ eventId }: { eventId: string }) {
  const [state, formAction] = useActionState(
    importParticipantsExcelAction.bind(null, eventId),
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);
  const hasResult = state.ok && (state.created > 0 || state.skipped > 0 || state.errors.length > 0);

  useEffect(() => {
    if (state.ok && (state.created > 0 || state.skipped > 0)) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-3 rounded-3xl border-[2.5px] border-ink bg-white p-6 shadow-sticker-ink"
    >
      <h2 className="font-display text-lg font-bold">Subir Excel con participantes</h2>
      <p className="text-neutral-400">
        Columnas: <strong>Nombre</strong>, <strong>Email</strong> y{" "}
        <strong>Departamento</strong> (opcional). Los emails que ya existan
        se saltan automáticamente.
      </p>

      {!state.ok && (
        <p className="rounded-full border-2 border-ink bg-cream px-4 py-2 text-sm">
          {state.error}
        </p>
      )}

      {hasResult && (
        <div className="rounded-2xl border-2 border-ink bg-cream p-4 text-sm">
          <p>
            {state.ok && `${state.created} creado(s), ${state.skipped} saltado(s) por email duplicado.`}
          </p>
          {state.ok && state.errors.length > 0 && (
            <ul className="mt-2 list-disc pl-5">
              {state.errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <input
        type="file"
        name="file"
        accept=".xlsx,.xls"
        required
        className="text-sm"
      />
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="self-start rounded-full bg-ink px-6 py-2 font-display font-bold text-cream shadow-sticker-fuchsia transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-40"
    >
      {pending ? "Importando…" : "Importar"}
    </button>
  );
}
