"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { createCategoryAction, type ActionResult } from "@/server/actions/admin/categories";

const initialState: ActionResult = { ok: true };

export function NewCategoryForm({ eventId }: { eventId: string }) {
  const [state, formAction] = useActionState(
    createCategoryAction.bind(null, eventId),
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
      className="rounded-3xl border-[2.5px] border-dashed border-ink bg-white p-6"
    >
      <h2 className="font-display text-lg font-bold">Añadir categoría</h2>

      {!state.ok && (
        <p className="mt-2 rounded-full border-2 border-ink bg-cream px-4 py-2 text-sm">
          {state.error}
        </p>
      )}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          name="name"
          placeholder="Nombre de la categoría"
          required
          className="flex-1 rounded-full border-2 border-ink px-4 py-2"
        />
        <input
          type="text"
          name="description"
          placeholder="Descripción (opcional)"
          className="flex-1 rounded-full border-2 border-ink px-4 py-2"
        />
        <SubmitButton />
      </div>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="shrink-0 rounded-full bg-ink px-6 py-2 font-display font-bold text-cream shadow-sticker-fuchsia transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-40"
    >
      {pending ? "Añadiendo…" : "Añadir"}
    </button>
  );
}
