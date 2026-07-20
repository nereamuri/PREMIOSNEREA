import { prisma } from "@/lib/db";

export type ParticipationStats = {
  total: number;
  submitted: number;
  inProgress: number;
  pending: number;
  byDepartment: Array<{
    department: string;
    total: number;
    submitted: number;
  }>;
};

export async function getParticipationStats(
  eventId: string
): Promise<ParticipationStats> {
  const participants = await prisma.participant.findMany({
    where: { eventId },
    select: {
      department: true,
      votingSession: { select: { status: true } },
    },
  });

  const total = participants.length;
  let submitted = 0;
  let inProgress = 0;
  let pending = 0;

  const departmentMap = new Map<string, { total: number; submitted: number }>();

  for (const p of participants) {
    const status = p.votingSession?.status ?? "pending";
    if (status === "submitted") submitted++;
    else if (status === "in_progress") inProgress++;
    else pending++;

    const department = p.department ?? "Sin departamento";
    const entry = departmentMap.get(department) ?? { total: 0, submitted: 0 };
    entry.total += 1;
    if (status === "submitted") entry.submitted += 1;
    departmentMap.set(department, entry);
  }

  const byDepartment = [...departmentMap.entries()]
    .map(([department, counts]) => ({ department, ...counts }))
    .sort((a, b) => a.department.localeCompare(b.department));

  return { total, submitted, inProgress, pending, byDepartment };
}
