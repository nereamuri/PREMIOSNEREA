"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import {
  createCandidateAction,
  type ActionResult,
} from "@/server/actions/admin/candidates";

const initialState: ActionResult = { ok: true };

export function NewCandidateForm({ categoryId }: { categoryId: string }) {
  const [state, formAction] = useActionState(
    createCandidateAction.bind(null, categoryId),
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-3 rounded-2xl border-2 border-dashed border-ink p-4"
    >
      {!state.ok && (
        <p className="rounded-full border-2 border-ink bg-cream px-4 py-2 text-sm">
          {state.error}
        </p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          name="name"
          placeholder="Nombre del candidato"
          required
          className="flex-1 rounded-full border-2 border-ink px-4 py-2"
        />
        <input
          type="text"
          name="department"
          placeholder="Departamento (opcional)"
          className="flex-1 rounded-full border-2 border-ink px-4 py-2"
        />
      </div>
      <label className="text-sm">
        <span className="mb-1 block font-bold">Foto (opcional)</span>
        <input type="file" name="photo" accept="image/jpeg,image/png,image/webp" />
      </label>
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
      {pending ? "Añadiendo…" : "Añadir candidato"}
    </button>
  );
}
