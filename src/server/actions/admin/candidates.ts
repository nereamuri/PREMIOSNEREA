"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  deleteCandidatePhoto,
  uploadCandidatePhoto,
  validateCandidatePhoto,
} from "@/server/services/storage";

export type ActionResult = { ok: true } | { ok: false; error: string };

function readPhoto(formData: FormData): File | null {
  const photo = formData.get("photo");
  return photo instanceof File && photo.size > 0 ? photo : null;
}

export async function createCandidateAction(
  categoryId: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const name = ((formData.get("name") as string) ?? "").trim();
  const department = ((formData.get("department") as string) ?? "").trim();
  const photo = readPhoto(formData);

  if (!name) {
    return { ok: false, error: "El nombre del candidato es obligatorio." };
  }

  if (photo) {
    const validationError = validateCandidatePhoto(photo);
    if (validationError) return { ok: false, error: validationError };
  }

  const candidate = await prisma.candidate.create({
    data: { categoryId, name, department: department || null },
  });

  if (photo) {
    try {
      const photoUrl = await uploadCandidatePhoto(candidate.id, photo);
      await prisma.candidate.update({
        where: { id: candidate.id },
        data: { photoUrl },
      });
    } catch (err) {
      // El candidato ya se creó sin foto; no revertimos la creación por un
      // fallo de subida, solo lo avisamos para que se reintente al editar.
      return {
        ok: false,
        error:
          err instanceof Error
            ? `Candidato creado, pero ${err.message}`
            : "Candidato creado, pero falló la subida de la foto.",
      };
    }
  }

  revalidatePath("/admin/categorias");
  return { ok: true };
}

export async function updateCandidateAction(
  candidateId: string,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const name = ((formData.get("name") as string) ?? "").trim();
  const department = ((formData.get("department") as string) ?? "").trim();
  const photo = readPhoto(formData);

  if (!name) {
    return { ok: false, error: "El nombre del candidato es obligatorio." };
  }

  if (photo) {
    const validationError = validateCandidatePhoto(photo);
    if (validationError) return { ok: false, error: validationError };
  }

  const data: { name: string; department: string | null; photoUrl?: string } = {
    name,
    department: department || null,
  };

  if (photo) {
    try {
      data.photoUrl = await uploadCandidatePhoto(candidateId, photo);
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Falló la subida de la foto.",
      };
    }
  }

  await prisma.candidate.update({ where: { id: candidateId }, data });

  revalidatePath("/admin/categorias");
  return { ok: true };
}

/**
 * Igual que con las categorías: si el candidato ya tiene votos reales, se
 * rechaza el borrado en servidor.
 */
export async function deleteCandidateAction(
  candidateId: string
): Promise<ActionResult> {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    select: { _count: { select: { selections: true } } },
  });

  if (!candidate) {
    return { ok: false, error: "El candidato no existe." };
  }

  if (candidate._count.selections > 0) {
    return {
      ok: false,
      error: `Este candidato ya tiene ${candidate._count.selections} voto(s) registrados y no se puede eliminar.`,
    };
  }

  await deleteCandidatePhoto(candidateId);
  await prisma.candidate.delete({ where: { id: candidateId } });

  revalidatePath("/admin/categorias");
  return { ok: true };
}
