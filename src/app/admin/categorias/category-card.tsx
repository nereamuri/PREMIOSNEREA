"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import {
  deleteCategoryAction,
  moveCategoryAction,
  updateCategoryAction,
  type ActionResult,
} from "@/server/actions/admin/categories";
import type { CategoriesWithCandidates } from "@/server/services/admin/categories";
import { CandidateItem } from "./candidate-item";
import { NewCandidateForm } from "./new-candidate-form";

const initialState: ActionResult = { ok: true };

export function CategoryCard({
  category,
  isFirst,
  isLast,
}: {
  category: CategoriesWithCandidates[number];
  isFirst: boolean;
  isLast: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [state, formAction] = useActionState(
    updateCategoryAction.bind(null, category.id),
    initialState
  );

  useEffect(() => {
    if (state.ok) setIsEditing(false);
  }, [state]);

  function handleDelete() {
    if (category._count.selections > 0) {
      setDeleteError(
        `Esta categoría ya tiene ${category._count.selections} voto(s) registrados y no se puede eliminar.`
      );
      return;
    }
    if (category.candidates.length > 0) {
      const confirmed = window.confirm(
        `Esta categoría tiene ${category.candidates.length} candidato(s) configurados. Si la eliminas, se eliminarán también ellos y sus fotos. ¿Continuar?`
      );
      if (!confirmed) return;
    } else if (!window.confirm(`¿Eliminar la categoría "${category.name}"?`)) {
      return;
    }

    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteCategoryAction(category.id);
      if (!result.ok) setDeleteError(result.error);
    });
  }

  function handleMove(direction: "up" | "down") {
    startTransition(async () => {
      await moveCategoryAction(category.id, direction);
    });
  }

  return (
    <div className="rounded-3xl border-[2.5px] border-ink bg-white p-6 shadow-sticker-ink">
      {isEditing ? (
        <form action={formAction} className="flex flex-col gap-3">
          {!state.ok && (
            <p className="rounded-full border-2 border-ink bg-cream px-4 py-2 text-sm">
              {state.error}
            </p>
          )}
          <input
            type="text"
            name="name"
            defaultValue={category.name}
            required
            className="rounded-full border-2 border-ink px-4 py-2 font-display font-bold"
          />
          <input
            type="text"
            name="description"
            defaultValue={category.description ?? ""}
            placeholder="Descripción (opcional)"
            className="rounded-full border-2 border-ink px-4 py-2"
          />
          <div className="flex gap-3">
            <SaveButton />
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-full border-2 border-ink px-5 py-2 text-sm font-bold"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold">{category.name}</h2>
            {category.description && (
              <p className="mt-1 text-neutral-400">{category.description}</p>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              disabled={isFirst || isPending}
              onClick={() => handleMove("up")}
              aria-label="Mover categoría arriba"
              className="rounded-full border-2 border-ink px-3 py-1.5 text-sm font-bold disabled:opacity-30"
            >
              ↑
            </button>
            <button
              type="button"
              disabled={isLast || isPending}
              onClick={() => handleMove("down")}
              aria-label="Mover categoría abajo"
              className="rounded-full border-2 border-ink px-3 py-1.5 text-sm font-bold disabled:opacity-30"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="rounded-full border-2 border-ink px-4 py-1.5 text-sm font-bold"
            >
              Editar
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={handleDelete}
              className="rounded-full border-2 border-ink px-4 py-1.5 text-sm font-bold disabled:opacity-40"
            >
              Eliminar
            </button>
          </div>
        </div>
      )}

      {deleteError && (
        <p className="mt-3 rounded-full border-2 border-ink bg-cream px-4 py-2 text-sm">
          {deleteError}
        </p>
      )}

      <div className="mt-5 flex flex-col gap-3">
        {category.candidates.map((candidate) => (
          <CandidateItem key={candidate.id} candidate={candidate} />
        ))}
      </div>

      <div className="mt-4">
        <NewCandidateForm categoryId={category.id} />
      </div>
    </div>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-ink px-6 py-2 font-display font-bold text-cream shadow-sticker-fuchsia transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-40"
    >
      {pending ? "Guardando…" : "Guardar"}
    </button>
  );
}
