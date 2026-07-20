import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Sesión de admin firmada con HMAC, sin base de datos ni servicio externo:
 * la cookie guarda `expiresAt.firma`, y la firma es HMAC(AUTH_SECRET,
 * expiresAt). Solo el servidor (que conoce AUTH_SECRET) puede generar una
 * firma válida, así que no hace falta guardar sesiones en ningún sitio.
 *
 * Interino mientras no haya acceso a Azure AD (bloqueado por permisos del
 * tenant) — pensado para sustituirse por Auth.js + Microsoft Entra ID en
 * cuanto llegue, sin tocar el resto del panel de admin (el middleware es
 * el único punto de entrada de esta lógica).
 */
export const ADMIN_SESSION_COOKIE = "admin_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

function sign(expiresAt: number): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET no está configurado.");
  }
  return createHmac("sha256", secret).update(String(expiresAt)).digest("hex");
}

export function createSessionCookieValue(): string {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  return `${expiresAt}.${sign(expiresAt)}`;
}

export function isValidSessionCookieValue(value: string | undefined): boolean {
  if (!value) return false;

  const [expiresAtRaw, signature] = value.split(".");
  const expiresAt = Number(expiresAtRaw);
  if (!expiresAt || !signature) return false;
  if (Date.now() > expiresAt) return false;

  const expected = sign(expiresAt);
  const provided = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (provided.length !== expectedBuffer.length) return false;

  return timingSafeEqual(provided, expectedBuffer);
}
