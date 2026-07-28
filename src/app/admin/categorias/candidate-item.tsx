"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import {
  deleteCandidateAction,
  updateCandidateAction,
  type ActionResult,
} from "@/server/actions/admin/candidates";
import type { CategoriesWithCandidates } from "@/server/services/admin/categories";

const initialState: ActionResult = { ok: true };

type Candidate = CategoriesWithCandidates[number]["candidates"][number];

export function CandidateItem({ candidate }: { candidate: Candidate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  const [state, formAction] = useActionState(
    updateCandidateAction.bind(null, candidate.id),
    initialState
  );

  useEffect(() => {
    if (state.ok) setIsEditing(false);
  }, [state]);

  function handleDelete() {
    if (candidate._count.selections > 0) {
      setDeleteError(
        `Este candidato ya tiene ${candidate._count.selections} voto(s) registrados y no se puede eliminar.`
      );
      return;
    }
    if (!window.confirm(`¿Eliminar a "${candidate.name}"?`)) return;

    setDeleteError(null);
    startDeleteTransition(async () => {
      const result = await deleteCandidateAction(candidate.id);
      if (!result.ok) setDeleteError(result.error);
    });
  }

  if (isEditing) {
    return (
      <form
        action={formAction}
        className="flex flex-col gap-3 rounded-2xl border-2 border-ink p-4"
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
            defaultValue={candidate.name}
            required
            className="flex-1 rounded-full border-2 border-ink px-4 py-2 font-bold"
          />
          <input
            type="text"
            name="department"
            defaultValue={candidate.department ?? ""}
            placeholder="Departamento (opcional)"
            className="flex-1 rounded-full border-2 border-ink px-4 py-2"
          />
        </div>
        <label className="text-sm">
          <span className="mb-1 block font-bold">
            Foto {candidate.photoUrl && "(ya tiene una — solo sube si quieres cambiarla)"}
          </span>
          <input type="file" name="photo" accept="image/jpeg,image/png,image/webp" />
        </label>
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
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border-2 border-ink p-4">
      <div className="flex items-center gap-4">
        <CandidatePhoto photoUrl={candidate.photoUrl} name={candidate.name} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display font-bold">{candidate.name}</p>
          {candidate.department && (
            <p className="truncate text-sm text-neutral-400">
              {candidate.department}
            </p>
          )}
          {candidate._count.selections > 0 && (
            <p className="mt-1 text-sm text-neutral-400">
              {candidate._count.selections} voto(s)
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="flex-1 rounded-full border-2 border-ink px-4 py-1.5 text-sm font-bold"
        >
          Editar
        </button>
        <button
          type="button"
          disabled={isDeleting}
          onClick={handleDelete}
          className="flex-1 rounded-full border-2 border-ink px-4 py-1.5 text-sm font-bold disabled:opacity-40"
        >
          Eliminar
        </button>
      </div>
      {deleteError && (
        <p className="rounded-full border-2 border-ink bg-cream px-4 py-2 text-sm">
          {deleteError}
        </p>
      )}
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

function CandidatePhoto({
  photoUrl,
  name,
}: {
  photoUrl: string | null;
  name: string;
}) {
  if (photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={photoUrl}
        alt={name}
        className="h-14 w-14 shrink-0 rounded-full border-2 border-ink object-cover"
      />
    );
  }

  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-cream font-display font-bold">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
