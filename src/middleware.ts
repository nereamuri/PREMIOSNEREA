import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, isValidSessionCookieValue } from "@/lib/admin-session";

export function middleware(req: NextRequest) {
  const cookie = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;

  if (!isValidSessionCookieValue(cookie)) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // /ceremonia vive fuera de /admin (para no heredar su cabecera de
  // navegación en la pantalla proyectada), pero necesita la misma
  // protección por contraseña que el resto del panel. Igual con el
  // flujo de conexión a Google Drive: solo el admin debe poder iniciarlo.
  matcher: ["/admin/:path*", "/ceremonia/:path*", "/api/auth/google/:path*"],
  runtime: "nodejs", // isValidSessionCookieValue usa node:crypto, no soportado en Edge
};
