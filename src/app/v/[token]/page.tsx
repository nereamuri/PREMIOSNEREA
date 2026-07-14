export default async function VotingEntryPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Fase 3: aquí se resolverá el token contra VotingSession,
  // se cargará el estado de progreso y se renderizará la pantalla
  // de bienvenida o la categoría en curso.
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 p-8 text-center">
      <h1 className="text-2xl font-semibold">Bienvenida/o a Premios Nerea</h1>
      <p className="text-neutral-400">
        Token recibido: <span className="text-accent">{token}</span>
      </p>
      <p className="max-w-sm text-sm text-neutral-400">
        El flujo real de votación (categorías, progreso, resumen y envío) se
        implementa en la Fase 3.
      </p>
    </main>
  );
}
