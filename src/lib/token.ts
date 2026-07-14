import { randomUUID } from "node:crypto";

/**
 * Genera el token único de acceso a una votación (VotingSession.token).
 *
 * Usa UUID v4 (122 bits de entropía real), tal y como se decidió en la
 * arquitectura de Fase 1: "largo y no adivinable, no correlativo". No es
 * más que un identificador de sesión — el control de acceso real (que el
 * voto no pueda modificarse tras enviarse, que cada token pertenezca a un
 * único participante) vive en server/services, no en esta función.
 */
export function generateVotingToken(): string {
  return randomUUID();
}

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Valida el formato antes de tocar la base de datos con un token recibido por URL. */
export function isValidTokenFormat(token: string): boolean {
  return UUID_V4_REGEX.test(token);
}
