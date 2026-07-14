export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-3xl font-semibold">Premios Nerea</h1>
      <p className="max-w-md text-neutral-400">
        Esta es la página raíz de la plataforma. El flujo de votación vive en{" "}
        <code className="rounded bg-ink-900 px-1.5 py-0.5 text-accent">
          /v/[token]
        </code>{" "}
        y el panel de administración en{" "}
        <code className="rounded bg-ink-900 px-1.5 py-0.5 text-accent">
          /admin
        </code>
        . Se irán construyendo fase a fase.
      </p>
    </main>
  );
}
