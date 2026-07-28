import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-cream p-8 text-center">
      <div className="max-w-sm rounded-3xl border-[2.5px] border-ink bg-white p-8 shadow-sticker-ink">
        <h1 className="font-display text-2xl font-bold">
          Acceso de administración
        </h1>
        <p className="mt-2 text-neutral-400">
          Introduce la contraseña de administración para gestionar Premios
          Nerea.
        </p>
        <LoginForm callbackUrl={params.callbackUrl ?? "/admin"} />
      </div>
    </main>
  );
}
