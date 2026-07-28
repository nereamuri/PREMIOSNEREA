import Image from "next/image";
import Link from "next/link";
import { logoutAction } from "@/server/actions/admin-auth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b-[2.5px] border-ink bg-white px-6 py-4">
        <div className="flex flex-wrap items-center gap-6">
          <Link href="/admin" aria-label="Ir a inicio">
            <Image
              src="/nereapremios.png"
              alt="Premios Nerea"
              width={40}
              height={35}
              priority
            />
          </Link>
          <nav className="flex flex-wrap gap-4 font-display text-sm font-bold">
            <Link href="/admin/dashboard">Dashboard</Link>
            <Link href="/admin/categorias">Categorías</Link>
            <Link href="/admin/participantes">Participantes</Link>
            <Link href="/admin/resultados">Resultados</Link>
            <Link href="/ceremonia">Modo Ceremonia</Link>
          </nav>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-full border-2 border-ink px-4 py-1.5 text-sm font-bold"
          >
            Cerrar sesión
          </button>
        </form>
      </header>
      {children}
    </div>
  );
}
