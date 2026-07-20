"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Vuelve a pedir los datos del servidor cada `intervalMs` sin recargar la
 * página entera (usa el refresh de Next.js) — así el dashboard se acerca
 * a "tiempo real" sin necesitar websockets para un evento de este tamaño.
 */
export function AutoRefresh({ intervalMs = 15000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}
