import { getSupabaseServiceClient } from "@/lib/supabase";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Valida en servidor antes de subir — nunca confiar en la validación del navegador. */
export function validatePhoto(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "La foto debe ser JPG, PNG o WebP.";
  }
  if (file.size > MAX_SIZE_BYTES) {
    return "La foto no puede superar 5MB.";
  }
  return null;
}

/**
 * Sube (o reemplaza, con upsert) una foto a uno de los buckets de fotos.
 * El nombre del archivo en el bucket es siempre el id de la fila (candidato
 * o participante), sin extensión — el content-type se guarda aparte, así
 * que reemplazar una foto no deja archivos huérfanos aunque cambie de
 * formato (jpg -> png, etc).
 */
async function uploadPhoto(
  bucket: "candidate-photos" | "participant-photos",
  id: string,
  file: File
): Promise<string> {
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase.storage
    .from(bucket)
    .upload(id, file, { contentType: file.type, upsert: true });

  if (error) {
    throw new Error(`No se pudo subir la foto: ${error.message}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(id);
  return data.publicUrl;
}

async function deletePhoto(
  bucket: "candidate-photos" | "participant-photos",
  id: string
): Promise<void> {
  const supabase = getSupabaseServiceClient();
  await supabase.storage.from(bucket).remove([id]);
}

export const validateCandidatePhoto = validatePhoto;
export const validateParticipantPhoto = validatePhoto;

export function uploadCandidatePhoto(candidateId: string, file: File) {
  return uploadPhoto("candidate-photos", candidateId, file);
}

export function deleteCandidatePhoto(candidateId: string) {
  return deletePhoto("candidate-photos", candidateId);
}

export function uploadParticipantPhoto(participantId: string, file: File) {
  return uploadPhoto("participant-photos", participantId, file);
}

export function deleteParticipantPhoto(participantId: string) {
  return deletePhoto("participant-photos", participantId);
}
