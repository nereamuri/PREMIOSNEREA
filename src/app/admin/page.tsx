import Link from "next/link";
import {
  getActiveEvent,
  getAllCandidatesForEvent,
} from "@/server/services/admin/categories";
import { getParticipationStats } from "@/server/services/admin/participation-stats";
import { CandidateCarousel } from "./candidate-carousel";

function pct(n: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((n / total) * 100);
}

function NextAction({
  total,
  pending,
  inProgress,
}: {
  total: number;
  pending: number;
  inProgress: number;
}) {
  if (total === 0) {
    return (
      <>
        <p className="font-display text-lg font-bold">Todavía no hay participantes</p>
        <p className="mt-1 text-neutral-400">
          Añade a las personas que van a votar para empezar.
        </p>
        <Link
          href="/admin/participantes"
          className="mt-4 inline-block rounded-full bg-ink px-6 py-2.5 font-display font-bold text-cream shadow-sticker-fuchsia transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          Ir a Participantes
        </Link>
      </>
    );
  }

  if (pending + inProgress > 0) {
    return (
      <>
        <p className="font-display text-lg font-bold">
          Faltan {pending + inProgress} persona{pending + inProgress === 1 ? "" : "s"} por votar
        </p>
        <p className="mt-1 text-neutral-400">
          Puedes enviarles un recordatorio desde Participantes.
        </p>
        <Link
          href="/admin/participantes"
          className="mt-4 inline-block rounded-full bg-ink px-6 py-2.5 font-display font-bold text-cream shadow-sticker-fuchsia transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          Ir a Participantes
        </Link>
      </>
    );
  }

  return (
    <>
      <p className="font-display text-lg font-bold">
        ¡Todo el mundo ha votado! 🎉
      </p>
      <p className="mt-1 text-neutral-400">
        Ya puedes revisar los resultados o lanzar el Modo Ceremonia.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href="/admin/resultados"
          className="inline-block rounded-full bg-ink px-6 py-2.5 font-display font-bold text-cream shadow-sticker-fuchsia transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          Ver resultados
        </Link>
        <Link
          href="/ceremonia"
          className="inline-block rounded-full border-2 border-ink px-6 py-2.5 font-display font-bold transition-transform active:translate-x-[2px] active:translate-y-[2px]"
        >
          Modo Ceremonia
        </Link>
      </div>
    </>
  );
}

const SECTIONS = [
  {
    href: "/admin/categorias",
    title: "Categorías",
    description: "Gestiona categorías y candidatos.",
  },
  {
    href: "/admin/participantes",
    title: "Participantes",
    description: "Altas, enlaces de voto y envío de emails.",
  },
  {
    href: "/admin/resultados",
    title: "Resultados",
    description: "Excel, resumen de ganadores y backup en Drive.",
  },
  {
    href: "/ceremonia",
    title: "Modo Ceremonia",
    description: "Revelación animada de los ganadores.",
  },
];

export default async function AdminHomePage() {
  const event = await getActiveEvent();
  const stats = await getParticipationStats(event.id);
  const candidates = await getAllCandidatesForEvent(event.id);
  const participation = pct(stats.submitted, stats.total);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 bg-cream p-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{event.name}</h1>
        <p className="mt-1 text-neutral-400">
          Bienvenida al panel de administración.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border-[2.5px] border-ink bg-white p-6 shadow-sticker-ink">
          <p className="text-sm text-neutral-400">Participación global</p>
          <p className="font-display text-6xl font-bold">{participation}%</p>
          <p className="mt-1 text-sm text-neutral-400">
            {stats.submitted} de {stats.total} votaciones enviadas
          </p>
        </div>

        <div className="rounded-3xl border-[2.5px] border-ink bg-white p-6 shadow-sticker-ink">
          <NextAction
            total={stats.total}
            pending={stats.pending}
            inProgress={stats.inProgress}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="rounded-3xl border-2 border-ink bg-white p-6 shadow-sticker-fuchsia transition-transform hover:-translate-y-0.5 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            <h2 className="font-display text-lg font-bold">{section.title}</h2>
            <p className="mt-1 text-sm text-neutral-400">{section.description}</p>
          </Link>
        ))}
      </div>

      <CandidateCarousel candidates={candidates} />
    </main>
  );
}
