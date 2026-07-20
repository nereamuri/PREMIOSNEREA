import { prisma } from "@/lib/db";

export async function getResultsExportData(eventId: string) {
  const participants = await prisma.participant.findMany({
    where: { eventId },
    orderBy: { name: "asc" },
    include: { votingSession: true },
  });

  const categories = await prisma.category.findMany({
    where: { eventId },
    orderBy: { order: "asc" },
    include: {
      candidates: { select: { id: true, name: true } },
      selections: {
        include: {
          candidate: { select: { name: true } },
          votingSession: {
            include: {
              participant: { select: { name: true, email: true, department: true } },
            },
          },
        },
      },
    },
  });

  return { participants, categories };
}
