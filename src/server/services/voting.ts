import { prisma } from "@/lib/db";
import { isValidTokenFormat } from "@/lib/token";

/**
 * Resuelve un token de votación contra VotingSession, con todo lo necesario
 * para renderizar el flujo de voto: evento, categorías (con candidatos) y
 * las selecciones ya guardadas de esa sesión.
 *
 * Devuelve un resultado discriminado en vez de null/throw para que quien
 * llame (la página) decida qué pantalla mostrar en cada caso sin try/catch.
 */
export type VotingSessionResult =
  | { kind: "invalid_format" }
  | { kind: "not_found" }
  | { kind: "ok"; data: VotingSessionData };

export type VotingSessionData = {
  token: string;
  status: "pending" | "in_progress" | "submitted";
  event: {
    name: string;
    description: string | null;
  };
  categories: Array<{
    id: string;
    name: string;
    description: string | null;
    order: number;
    candidates: Array<{
      id: string;
      name: string;
      department: string | null;
      photoUrl: string | null;
    }>;
  }>;
  /** categoryId -> candidateId ya seleccionado en esta sesión */
  selections: Record<string, string>;
};

export async function getVotingSessionByToken(
  token: string
): Promise<VotingSessionResult> {
  if (!isValidTokenFormat(token)) {
    return { kind: "invalid_format" };
  }

  const session = await prisma.votingSession.findUnique({
    where: { token },
    include: {
      participant: {
        include: {
          event: {
            include: {
              categories: {
                orderBy: { order: "asc" },
                include: { candidates: true },
              },
            },
          },
        },
      },
      selections: true,
    },
  });

  if (!session) {
    return { kind: "not_found" };
  }

  const { event } = session.participant;

  return {
    kind: "ok",
    data: {
      token: session.token,
      status: session.status,
      event: { name: event.name, description: event.description },
      categories: event.categories.map((category) => ({
        id: category.id,
        name: category.name,
        description: category.description,
        order: category.order,
        candidates: category.candidates.map((candidate) => ({
          id: candidate.id,
          name: candidate.name,
          department: candidate.department,
          photoUrl: candidate.photoUrl,
        })),
      })),
      selections: Object.fromEntries(
        session.selections.map((s) => [s.categoryId, s.candidateId])
      ),
    },
  };
}
