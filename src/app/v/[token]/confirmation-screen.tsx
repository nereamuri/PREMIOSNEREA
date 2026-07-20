export function ConfirmationScreen({ eventName }: { eventName: string }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-cream p-8 text-center">
      {/* Peana clara: el logo tiene contorno negro y se pierde sobre fondos
          oscuros, así que siempre va sobre una tarjeta blanca con sombra. */}
      <div className="rounded-3xl border-[2.5px] border-ink bg-white p-8 shadow-sticker-fuchsia">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/nereapremios.png"
          alt="Premios Nerea"
          className="mx-auto h-32 w-32 object-contain"
        />
      </div>
      <div className="max-w-md">
        <h1 className="font-display text-3xl font-bold">
          ¡Gracias por votar!
        </h1>
        <p className="mt-3 text-neutral-400">
          Tu votación para {eventName} se ha enviado correctamente. Ya no
          puede modificarse. Los resultados se anunciarán próximamente.
        </p>
      </div>
    </main>
  );
}
