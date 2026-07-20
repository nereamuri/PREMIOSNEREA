import { getVotingSessionByToken } from "@/server/services/voting";
import { VotingFlow } from "./voting-flow";
import { ConfirmationScreen } from "./confirmation-screen";

export default async function VotingEntryPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await getVotingSessionByToken(token);

  if (result.kind === "invalid_format" || result.kind === "not_found") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream p-8 text-center">
        <div className="max-w-sm rounded-3xl border-[2.5px] border-ink bg-white p-8 shadow-sticker-ink">
          <h1 className="font-display text-2xl font-bold">
            Enlace no válido
          </h1>
          <p className="mt-2 text-neutral-400">
            Este enlace de votación no existe o ya no es válido. Comprueba que
            lo has copiado completo, o pide uno nuevo a la organización.
          </p>
        </div>
      </main>
    );
  }

  if (result.data.status === "submitted") {
    return <ConfirmationScreen eventName={result.data.event.name} />;
  }

  // key={token}: fuerza a React a remontar el componente si se navega de un
  // token a otro sin recargar la página entera, para no arrastrar el paso
  // ni las selecciones en memoria de la sesión anterior.
  return <VotingFlow key={token} token={token} data={result.data} />;
}
