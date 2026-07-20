"use client";

import { useMemo, useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { saveSelectionAction, submitVoteAction } from "@/server/actions/voting";
import type { VotingSessionData } from "@/server/services/voting";
import { ConfirmationScreen } from "./confirmation-screen";

export function VotingFlow({
  token,
  data,
}: {
  token: string;
  data: VotingSessionData;
}) {
  const categories = data.categories;
  const summaryStep = categories.length + 1;

  // step 0 = bienvenida, 1..N = categoría N, N+1 = resumen
  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState(data.selections);
  const [pendingCategoryId, setPendingCategoryId] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, startSubmitTransition] = useTransition();
  const [, startTransition] = useTransition();

  const completedCount = useMemo(
    () => categories.filter((c) => selections[c.id]).length,
    [categories, selections]
  );
  const allCompleted = completedCount === categories.length;

  function handleSelect(categoryId: string, candidateId: string) {
    setError(null);
    const previous = selections[categoryId];
    setSelections((s) => ({ ...s, [categoryId]: candidateId }));
    setPendingCategoryId(categoryId);

    startTransition(async () => {
      const result = await saveSelectionAction(token, categoryId, candidateId);
      setPendingCategoryId(null);
      if (!result.ok) {
        setError(result.error);
        setSelections((s) => ({ ...s, [categoryId]: previous }));
      }
    });
  }

  function handleSubmit() {
    setSubmitError(null);
    startSubmitTransition(async () => {
      const result = await submitVoteAction(token);
      if (!result.ok) {
        setSubmitError(result.error);
        return;
      }
      setSubmitted(true);
    });
  }

  if (submitted) {
    return <ConfirmationScreen eventName={data.event.name} />;
  }

  if (step === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-cream p-8 text-center">
        <div className="max-w-md rounded-3xl border-[2.5px] border-ink bg-white p-8 shadow-sticker-ink">
          <h1 className="font-display text-3xl font-bold">
            {data.event.name}
          </h1>
          {data.event.description && (
            <p className="mt-3 text-neutral-400">{data.event.description}</p>
          )}
          <p className="mt-4 text-sm text-neutral-400">
            Vas a votar en {categories.length} categorías. Puedes avanzar,
            volver y cambiar tu selección tantas veces como quieras antes de
            enviar la votación final.
          </p>
          <button
            type="button"
            onClick={() => setStep(1)}
            className="mt-6 rounded-full bg-ink px-8 py-3 font-display font-bold text-cream shadow-sticker-fuchsia transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            Empezar a votar
          </button>
        </div>
      </main>
    );
  }

  if (step === summaryStep) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 bg-cream p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <ProgressBar completed={completedCount} total={categories.length} />

        <div className="rounded-3xl border-[2.5px] border-ink bg-white p-6 shadow-sticker-ink">
          <h1 className="font-display text-2xl font-bold">
            Resumen de tu votación
          </h1>
          <p className="mt-1 text-neutral-400">
            Revisa tus elecciones. Puedes editar cualquiera antes de enviar.
          </p>

          <ul className="mt-5 flex flex-col gap-3">
            {categories.map((category, index) => {
              const candidate = category.candidates.find(
                (c) => c.id === selections[category.id]
              );
              return (
                <li
                  key={category.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border-2 border-ink px-4 py-3"
                >
                  <div>
                    <p className="text-sm text-neutral-400">
                      {category.name}
                    </p>
                    <p className="font-display font-bold">
                      {candidate ? candidate.name : "Sin seleccionar"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(index + 1)}
                    className="shrink-0 rounded-full border-2 border-ink px-5 py-2.5 text-sm font-bold"
                  >
                    Editar
                  </button>
                </li>
              );
            })}
          </ul>

          {!allCompleted && (
            <p className="mt-4 rounded-full border-2 border-ink bg-cream px-4 py-2 text-sm">
              Te faltan {categories.length - completedCount} categorías por
              completar antes de poder enviar.
            </p>
          )}

          {submitError && (
            <p className="mt-4 rounded-full border-2 border-ink bg-cream px-4 py-2 text-sm">
              {submitError}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep(categories.length)}
            className="rounded-full border-[2.5px] border-ink bg-white px-6 py-2.5 font-display font-bold"
          >
            Atrás
          </button>
          <button
            type="button"
            disabled={!allCompleted || isSubmitting}
            onClick={handleSubmit}
            className="rounded-full bg-ink px-8 py-2.5 font-display font-bold text-cream shadow-sticker-fuchsia transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-40"
          >
            {isSubmitting ? "Enviando…" : "Enviar votación"}
          </button>
        </div>
      </main>
    );
  }

  const category = categories[step - 1];
  const selectedCandidateId = selections[category.id];

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 bg-cream p-6">
      <ProgressBar completed={completedCount} total={categories.length} />

      <div className="rounded-3xl border-[2.5px] border-ink bg-white p-6 shadow-sticker-ink">
        <h1 className="font-display text-2xl font-bold">{category.name}</h1>
        {category.description && (
          <p className="mt-1 text-neutral-400">{category.description}</p>
        )}

        {error && (
          <p className="mt-3 rounded-full border-2 border-ink bg-cream px-4 py-2 text-sm">
            {error}
          </p>
        )}

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {category.candidates.map((candidate) => {
            const isSelected = selectedCandidateId === candidate.id;
            return (
              <button
                key={candidate.id}
                type="button"
                disabled={pendingCategoryId !== null}
                onClick={() => handleSelect(category.id, candidate.id)}
                className={cn(
                  "flex flex-col items-center gap-3 rounded-2xl border-[2.5px] border-ink bg-white p-4 text-center transition-transform",
                  isSelected
                    ? "shadow-sticker-fuchsia -translate-x-[2px] -translate-y-[2px]"
                    : "shadow-sticker-ink hover:-translate-x-[1px] hover:-translate-y-[1px]"
                )}
              >
                <CandidatePhoto
                  photoUrl={candidate.photoUrl}
                  name={candidate.name}
                />
                <div>
                  <p className="break-words font-display font-bold">
                    {candidate.name}
                  </p>
                  {/* Altura reservada aunque no haya departamento, para que
                      las tarjetas de una misma fila no queden descuadradas. */}
                  <p className="min-h-[1.25em] text-sm text-neutral-400">
                    {candidate.department}
                  </p>
                </div>
                {/* Altura reservada también aquí: al seleccionar no debe
                    saltar el resto de tarjetas de la fila. */}
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 text-sm font-bold",
                    !isSelected && "invisible"
                  )}
                >
                  <span className="h-2 w-2 rounded-full bg-fuchsia" />
                  Seleccionado
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          disabled={step === 1}
          onClick={() => setStep((s) => s - 1)}
          className="rounded-full border-[2.5px] border-ink bg-white px-6 py-2.5 font-display font-bold disabled:opacity-40"
        >
          Atrás
        </button>
        <button
          type="button"
          onClick={() => setStep((s) => s + 1)}
          className="rounded-full bg-ink px-6 py-2.5 font-display font-bold text-cream shadow-sticker-fuchsia transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          {step === categories.length ? "Ver resumen" : "Siguiente"}
        </button>
      </div>
    </main>
  );
}

function ProgressBar({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  return (
    <div>
      <p className="mb-1.5 text-sm font-bold">
        {completed} de {total} categorías completadas
      </p>
      <div className="h-4 w-full overflow-hidden rounded-full border-2 border-ink bg-white">
        <div
          className="h-full rounded-full bg-fuchsia transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
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
        className="h-20 w-20 rounded-full border-2 border-ink object-cover"
      />
    );
  }

  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-ink bg-cream font-display text-xl font-bold">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

