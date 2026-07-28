import { getActiveEvent } from "@/server/services/admin/categories";
import { getParticipantsWithSessions } from "@/server/services/admin/participants";
import { AutoRefresh } from "./auto-refresh";

function pct(n: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((n / total) * 100)}%`;
}

export default async function AdminDashboardPage() {
  const event = await getActiveEvent();
  const participants = await getParticipantsWithSessions(event.id);

  const total = participants.length;
  const submitted = participants.filter(
    (p) => p.votingSession?.status === "submitted"
  );
  const inProgress = participants.filter(
    (p) => p.votingSession?.status === "in_progress"
  );
  const missing = participants.filter(
    (p) => (p.votingSession?.status ?? "pending") !== "submitted"
  );

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 bg-cream p-6">
      <AutoRefresh />

      <div>
        <h1 className="font-display text-3xl font-bold">
          Participación en tiempo real
        </h1>
        <p className="mt-1 text-neutral-400">
          {event.name} — se actualiza solo cada 15 segundos
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Participantes" value={total} />
        <StatTile
          label="Enviadas"
          value={submitted.length}
          hint={pct(submitted.length, total)}
        />
        <StatTile
          label="En curso"
          value={inProgress.length}
          hint={pct(inProgress.length, total)}
        />
        <StatTile
          label="Pendientes"
          value={missing.length}
          hint={pct(missing.length, total)}
        />
      </div>

      <div className="rounded-3xl border-[2.5px] border-ink bg-white p-6 shadow-sticker-ink">
        <p className="mb-1.5 text-sm font-bold">
          {submitted.length} de {total} votaciones enviadas (
          {pct(submitted.length, total)})
        </p>
        <div className="h-4 w-full overflow-hidden rounded-full border-2 border-ink bg-cream">
          <div
            className="h-full rounded-full bg-fuchsia transition-all"
            style={{ width: pct(submitted.length, total) }}
          />
        </div>
      </div>

      {missing.length > 0 && (
        <div className="rounded-3xl border-[2.5px] border-ink bg-white p-6 shadow-sticker-ink">
          <h2 className="font-display text-lg font-bold">
            Todavía no han votado
          </h2>
          <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {missing.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-xl border border-ink/10 px-3 py-2 text-sm"
              >
                <span className="font-bold">{p.name}</span>
                <span className="text-neutral-400">
                  {p.votingSession?.status === "in_progress"
                    ? "En curso"
                    : "Pendiente"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}

function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border-2 border-ink bg-white p-4 text-center">
      <p className="font-display text-3xl font-bold">{value}</p>
      <p className="text-sm text-neutral-400">{label}</p>
      {hint && <p className="mt-1 text-xs font-bold">{hint}</p>}
    </div>
  );
}
