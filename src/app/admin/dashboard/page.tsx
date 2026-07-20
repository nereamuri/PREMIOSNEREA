import { getActiveEvent } from "@/server/services/admin/categories";
import { getParticipationStats } from "@/server/services/admin/participation-stats";
import { AutoRefresh } from "./auto-refresh";

function pct(n: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((n / total) * 100)}%`;
}

export default async function AdminDashboardPage() {
  const event = await getActiveEvent();
  const stats = await getParticipationStats(event.id);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 bg-cream p-6">
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
        <StatTile label="Participantes" value={stats.total} />
        <StatTile
          label="Enviadas"
          value={stats.submitted}
          hint={pct(stats.submitted, stats.total)}
        />
        <StatTile
          label="En curso"
          value={stats.inProgress}
          hint={pct(stats.inProgress, stats.total)}
        />
        <StatTile
          label="Pendientes"
          value={stats.pending}
          hint={pct(stats.pending, stats.total)}
        />
      </div>

      <div className="rounded-3xl border-[2.5px] border-ink bg-white p-6 shadow-sticker-ink">
        <p className="mb-1.5 text-sm font-bold">
          {stats.submitted} de {stats.total} votaciones enviadas (
          {pct(stats.submitted, stats.total)})
        </p>
        <div className="h-4 w-full overflow-hidden rounded-full border-2 border-ink bg-cream">
          <div
            className="h-full rounded-full bg-fuchsia transition-all"
            style={{ width: pct(stats.submitted, stats.total) }}
          />
        </div>
      </div>

      {stats.byDepartment.length > 0 && (
        <div className="rounded-3xl border-[2.5px] border-ink bg-white p-6 shadow-sticker-ink">
          <h2 className="font-display text-lg font-bold">Por departamento</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {stats.byDepartment.map((dep) => (
              <li key={dep.department}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold">{dep.department}</span>
                  <span className="text-neutral-400">
                    {dep.submitted} de {dep.total} (
                    {pct(dep.submitted, dep.total)})
                  </span>
                </div>
                <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full border-2 border-ink bg-cream">
                  <div
                    className="h-full rounded-full bg-fuchsia transition-all"
                    style={{ width: pct(dep.submitted, dep.total) }}
                  />
                </div>
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
