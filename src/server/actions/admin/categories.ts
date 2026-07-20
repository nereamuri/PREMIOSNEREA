"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { deleteCandidatePhoto } from "@/server/services/storage";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function createCategoryAction(
  eventId: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const name = ((formData.get("name") as string) ?? "").trim();
  const description = ((formData.get("description") as string) ?? "").trim();

  if (!name) {
    return { ok: false, error: "El nombre de la categoría es obligatorio." };
  }

  const last = await prisma.category.findFirst({
    where: { eventId },
    orderBy: { order: "desc" },
  });
  const order = (last?.order ?? -1) + 1;

  await prisma.category.create({
    data: { eventId, name, description: description || null, order },
  });

  revalidatePath("/admin/categorias");
  return { ok: true };
}

export async function updateCategoryAction(
  categoryId: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const name = ((formData.get("name") as string) ?? "").trim();
  const description = ((formData.get("description") as string) ?? "").trim();

  if (!name) {
    return { ok: false, error: "El nombre de la categoría es obligatorio." };
  }

  await prisma.category.update({
    where: { id: categoryId },
    data: { name, description: description || null },
  });

  revalidatePath("/admin/categorias");
  return { ok: true };
}

/**
 * Si la categoría ya tiene votos reales (directamente, vía VoteSelection),
 * se rechaza el borrado en servidor — no basta con ocultar el botón en la
 * UI. Si no tiene votos pero sí candidatos ya configurados, se borran en
 * cascada junto con sus fotos (la UI pide confirmación explícita antes).
 */
export async function deleteCategoryAction(
  categoryId: string
): Promise<ActionResult> {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: {
      _count: { select: { selections: true } },
      candidates: { select: { id: true } },
    },
  });

  if (!category) {
    return { ok: false, error: "La categoría no existe." };
  }

  if (category._count.selections > 0) {
    return {
      ok: false,
      error: `Esta categoría ya tiene ${category._count.selections} voto(s) registrados y no se puede eliminar.`,
    };
  }

  await Promise.all(
    category.candidates.map((candidate) => deleteCandidatePhoto(candidate.id))
  );
  await prisma.category.delete({ where: { id: categoryId } });

  revalidatePath("/admin/categorias");
  return { ok: true };
}

export async function moveCategoryAction(
  categoryId: string,
  direction: "up" | "down"
): Promise<ActionResult> {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });
  if (!category) {
    return { ok: false, error: "La categoría no existe." };
  }

  const neighbor = await prisma.category.findFirst({
    where: {
      eventId: category.eventId,
      order: direction === "up" ? { lt: category.order } : { gt: category.order },
    },
    orderBy: { order: direction === "up" ? "desc" : "asc" },
  });

  if (!neighbor) {
    return { ok: true };
  }

  await prisma.$transaction([
    prisma.category.update({
      where: { id: category.id },
      data: { order: neighbor.order },
    }),
    prisma.category.update({
      where: { id: neighbor.id },
      data: { order: category.order },
    }),
  ]);

  revalidatePath("/admin/categorias");
  return { ok: true };
}
