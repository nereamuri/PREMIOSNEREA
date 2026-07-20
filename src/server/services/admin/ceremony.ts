import { prisma } from "@/lib/db";

export type CeremonyPerson = {
  id: string;
  name: string;
  department: string | null;
  photoUrl: string | null;
};

export type CeremonyPodiumRank = {
  rank: 1 | 2 | 3;
  votes: number;
  people: CeremonyPerson[];
};

export type CeremonyCategory = {
  id: string;
  name: string;
  description: string | null;
  nominees: CeremonyPerson[];
  podium: CeremonyPodiumRank[];
};

export async function getCeremonyData(
  eventId: string
): Promise<CeremonyCategory[]> {
  const categories = await prisma.category.findMany({
    where: { eventId },
    orderBy: { order: "asc" },
    include: {
      candidates: {
        orderBy: { name: "asc" },
        include: { _count: { select: { selections: true } } },
      },
    },
  });

  return categories.map((category) => {
    const nominees = category.candidates.map((c) => ({
      id: c.id,
      name: c.name,
      department: c.department,
      photoUrl: c.photoUrl,
    }));

    // Top 3 por tramos de votos distintos, no por candidato: si 3 personas
    // empatan en el número más alto de votos, ese es el único tramo "1" (no
    // se inventan un 2º y 3º puesto para completar el podio). Los empates
    // en cualquier puesto se muestran juntos, igual que decidiste para el
    // ganador único.
    const distinctVoteCounts = [...new Set(category.candidates.map((c) => c._count.selections))]
      .filter((votes) => votes > 0)
      .sort((a, b) => b - a)
      .slice(0, 3);

    const podium: CeremonyPodiumRank[] = distinctVoteCounts.map((votes, index) => ({
      rank: (index + 1) as 1 | 2 | 3,
      votes,
      people: category.candidates
        .filter((c) => c._count.selections === votes)
        .map((c) => ({
          id: c.id,
          name: c.name,
          department: c.department,
          photoUrl: c.photoUrl,
        })),
    }));

    return {
      id: category.id,
      name: category.name,
      description: category.description,
      nominees,
      podium,
    };
  });
}
