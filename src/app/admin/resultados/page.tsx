import { getActiveEvent } from "@/server/services/admin/categories";
import { getParticipantsWithSessions } from "@/server/services/admin/participants";
import { SendResultsEmailButton } from "./send-results-email-button";

export default async function AdminResultadosPage() {
  const event = await getActiveEvent();
  const participants = await getParticipantsWithSessions(event.id);
  const submitted = participants.filter(
    (p) => p.votingSession?.status === "submitted"
  ).length;
  const isDriveConnected = Boolean(process.env.GOOGLE_REFRESH_TOKEN);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 bg-cream p-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Resultados</h1>
        <p className="mt-1 text-neutral-400">
          {event.name} — {submitted} de {participants.length} han enviado su
          votación
        </p>
      </div>

      <div className="rounded-3xl border-[2.5px] border-ink bg-white p-6 shadow-sticker-ink">
        <h2 className="font-display text-lg font-bold">Excel de control</h2>
        <p className="mt-1 text-neutral-400">
          Descarga un archivo .xlsx con una pestaña &quot;Participación&quot;
          (estado de cada persona), una pestaña &quot;Resultados&quot; (votos
          por candidato en cada categoría, de más a menos votado) y una
          pestaña por categoría con el detalle de quién votó a quién.
          {isDriveConnected &&
            " Cada descarga también sube una copia a tu Google Drive."}
        </p>
        <a
          href="/admin/resultados/export"
          className="mt-4 inline-block rounded-full bg-ink px-6 py-2.5 font-display font-bold text-cream shadow-sticker-fuchsia transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          Descargar Excel
        </a>
      </div>

      <div className="rounded-3xl border-[2.5px] border-ink bg-white p-6 shadow-sticker-ink">
        <h2 className="font-display text-lg font-bold">Resumen de ganadores (PDF)</h2>
        <p className="mt-1 text-neutral-400">
          Un documento con una página por categoría mostrando a su ganador o
          ganadores (foto, nombre y departamento), sin números de votos —
          pensado para compartir o archivar tras la ceremonia.
          {isDriveConnected &&
            " También se sube una copia a tu Google Drive."}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href="/admin/resultados/export-pdf"
            className="inline-block rounded-full bg-ink px-6 py-2.5 font-display font-bold text-cream shadow-sticker-fuchsia transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            Descargar PDF
          </a>
          <SendResultsEmailButton eventId={event.id} />
        </div>
      </div>

      <div className="rounded-3xl border-2 border-ink bg-white p-6">
        <h2 className="font-display text-lg font-bold">Backup en Google Drive</h2>
        <p className="mt-1 text-neutral-400">
          {isDriveConnected
            ? "Conectado — el Excel se sube solo a la carpeta \"Premios Nerea\" de tu Drive cada vez que lo descargas."
            : "Todavía no está conectado. Conéctalo una vez y las siguientes exportaciones se subirán solas."}
        </p>
        {!isDriveConnected && (
          <a
            href="/api/auth/google/start"
            className="mt-4 inline-block rounded-full border-2 border-ink px-6 py-2.5 font-display font-bold"
          >
            Conectar Google Drive
          </a>
        )}
      </div>
    </main>
  );
}
