"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import {
  deleteParticipantAction,
  updateParticipantAction,
  type ActionResult,
} from "@/server/actions/admin/participants";
import type { ParticipantsWithSessions } from "@/server/services/admin/participants";

const initialState: ActionResult = { ok: true };

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  in_progress: "En curso",
  submitted: "Enviada",
};

type Participant = ParticipantsWithSessions[number];

export function ParticipantItem({ participant }: { participant: Participant }) {
  const [isEditing, setIsEditing] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();

  const [state, formAction] = useActionState(
    updateParticipantAction.bind(null, participant.id),
    initialState
  );

  useEffect(() => {
    if (state.ok) setIsEditing(false);
  }, [state]);

  function handleDelete() {
    const status = participant.votingSession?.status;
    if (status && status !== "pending") {
      setDeleteError(
        status === "submitted"
          ? "Este participante ya envió su votación y no se puede eliminar."
          : "Este participante ya empezó a votar y no se puede eliminar."
      );
      return;
    }
    if (!window.confirm(`¿Eliminar a "${participant.name}"?`)) return;

    setDeleteError(null);
    startDeleteTransition(async () => {
      const result = await deleteParticipantAction(participant.id);
      if (!result.ok) setDeleteError(result.error);
    });
  }

  async function handleCopyLink() {
    if (!participant.votingSession) return;
    const url = `${window.location.origin}/v/${participant.votingSession.token}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // El navegador puede denegar el permiso de portapapeles (Safari,
      // iframes restringidos, etc) — mostramos el enlace para copiarlo a
      // mano en vez de fingir que se copió.
      window.prompt("No se pudo copiar automáticamente. Copia el enlace:", url);
    }
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
            defaultValue={participant.name}
            required
            className="flex-1 rounded-full border-2 border-ink px-4 py-2 font-bold"
          />
          <input
            type="email"
            name="email"
            defaultValue={participant.email}
            required
            className="flex-1 rounded-full border-2 border-ink px-4 py-2"
          />
          <input
            type="text"
            name="department"
            defaultValue={participant.department ?? ""}
            placeholder="Departamento (opcional)"
            className="flex-1 rounded-full border-2 border-ink px-4 py-2"
          />
        </div>
        <label className="text-sm">
          <span className="mb-1 block font-bold">
            Foto {participant.photoUrl && "(ya tiene una — solo sube si quieres cambiarla)"}
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

  const status = participant.votingSession?.status;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border-2 border-ink p-4">
      <div className="flex flex-wrap items-center gap-4">
        <ParticipantPhoto photoUrl={participant.photoUrl} name={participant.name} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display font-bold">{participant.name}</p>
          <p className="truncate text-sm text-neutral-400">{participant.email}</p>
          {participant.department && (
            <p className="truncate text-sm text-neutral-400">
              {participant.department}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-sm">
          <span
            className="h-2 w-2 rounded-full bg-fuchsia"
            style={{ opacity: status === "submitted" ? 1 : status === "in_progress" ? 0.5 : 0.15 }}
          />
          {status ? STATUS_LABEL[status] : "Sin sesión"}
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            disabled={!participant.votingSession}
            className="rounded-full border-2 border-ink px-4 py-1.5 text-sm font-bold disabled:opacity-40"
          >
            {copied ? "¡Copiado!" : "Copiar enlace"}
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
            disabled={isDeleting}
            onClick={handleDelete}
            className="rounded-full border-2 border-ink px-4 py-1.5 text-sm font-bold disabled:opacity-40"
          >
            Eliminar
          </button>
        </div>
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

function ParticipantPhoto({
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
