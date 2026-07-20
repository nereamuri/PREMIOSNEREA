import { prisma } from "@/lib/db";

export async function getActiveEvent() {
  const slug = process.env.NEXT_PUBLIC_ACTIVE_EVENT_SLUG ?? "premios-nerea";
  const event = await prisma.event.findUnique({ where: { slug } });

  if (!event) {
    throw new Error(
      `No existe el evento "${slug}". Ejecuta "npm run db:seed" primero.`
    );
  }

  return event;
}

export async function getCategoriesWithCandidates(eventId: string) {
  return prisma.category.findMany({
    where: { eventId },
    orderBy: { order: "asc" },
    include: {
      candidates: {
        orderBy: { createdAt: "asc" },
        include: { _count: { select: { selections: true } } },
      },
      _count: { select: { selections: true } },
    },
  });
}

export type CategoriesWithCandidates = Awaited<
  ReturnType<typeof getCategoriesWithCandidates>
>;
