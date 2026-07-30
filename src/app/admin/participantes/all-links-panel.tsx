"use client";

import { useState } from "react";

type LinkRow = { id: string; name: string; email: string; token: string | null };

export function AllLinksPanel({ participants }: { participants: LinkRow[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function linkFor(token: string) {
    return `${window.location.origin}/v/${token}`;
  }

  async function copy(text: string, onDone: () => void) {
    try {
      await navigator.clipboard.writeText(text);
      onDone();
    } catch {
      window.prompt("No se pudo copiar automáticamente. Copia el enlace:", text);
    }
  }

  function copyAll() {
    const text = participants
      .filter((p) => p.token)
      .map((p) => `${p.name}: ${linkFor(p.token!)}`)
      .join("\n");
    copy(text, () => {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    });
  }

  return (
    <div className="rounded-3xl border-2 border-ink bg-white p-6 shadow-sticker-ink">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <div>
          <h2 className="font-display text-lg font-bold">
            Enlaces de voto de todos
          </h2>
          <p className="mt-1 text-neutral-400">
            Por si falla el envío automático y hay que pasar el enlace a mano.
          </p>
        </div>
        <span className="shrink-0 font-display text-xl font-bold">
          {isOpen ? "−" : "+"}
        </span>
      </button>

      {isOpen && (
        <div className="mt-5 flex flex-col gap-3">
          <button
            type="button"
            onClick={copyAll}
            className="self-start rounded-full border-2 border-ink px-4 py-1.5 text-sm font-bold"
          >
            {copiedAll ? "¡Copiados!" : "Copiar todos"}
          </button>

          <div className="flex flex-col gap-2">
            {participants.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-ink/10 px-3 py-2 text-sm"
              >
                <span className="min-w-[140px] font-bold">{p.name}</span>
                {p.token ? (
                  <>
                    <input
                      readOnly
                      value={linkFor(p.token)}
                      onFocus={(e) => e.currentTarget.select()}
                      className="min-w-0 flex-1 rounded-full border border-ink/20 bg-cream px-3 py-1 text-neutral-400"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        copy(linkFor(p.token!), () => {
                          setCopiedId(p.id);
                          setTimeout(() => setCopiedId(null), 2000);
                        })
                      }
                      className="shrink-0 rounded-full border-2 border-ink px-3 py-1 text-xs font-bold"
                    >
                      {copiedId === p.id ? "¡Copiado!" : "Copiar"}
                    </button>
                  </>
                ) : (
                  <span className="text-neutral-400">Sin sesión de voto</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
