import { prisma } from "@/lib/db";

export async function getParticipantsWithSessions(eventId: string) {
  return prisma.participant.findMany({
    where: { eventId },
    orderBy: { createdAt: "asc" },
    include: { votingSession: { select: { token: true, status: true } } },
  });
}

export type ParticipantsWithSessions = Awaited<
  ReturnType<typeof getParticipantsWithSessions>
>;
