import * as XLSX from "xlsx";
import { getActiveEvent } from "@/server/services/admin/categories";
import { getResultsExportData } from "@/server/services/admin/results-export";
import { uploadFileToDrive } from "@/server/services/google-drive";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  in_progress: "En curso",
  submitted: "Enviada",
};

/** Los nombres de hoja de Excel no admiten : \ / ? * [ ] ni más de 31 caracteres. */
function sanitizeSheetName(name: string, used: Set<string>): string {
  const base = name.replace(/[:\\/?*[\]]/g, "-").slice(0, 31).trim() || "Categoría";

  let candidate = base;
  let suffix = 2;
  while (used.has(candidate)) {
    candidate = `${base.slice(0, 28)} ${suffix}`;
    suffix++;
  }
  used.add(candidate);
  return candidate;
}

export async function GET() {
  const event = await getActiveEvent();
  const { participants, categories } = await getResultsExportData(event.id);

  const workbook = XLSX.utils.book_new();

  const participationRows = participants.map((p) => ({
    Nombre: p.name,
    Email: p.email,
    Departamento: p.department ?? "",
    Estado: p.votingSession ? STATUS_LABEL[p.votingSession.status] : "Sin sesión",
    "Fecha de envío": p.votingSession?.submittedAt
      ? p.votingSession.submittedAt.toLocaleString("es-ES")
      : "",
  }));
  const participationSheet = XLSX.utils.json_to_sheet(participationRows);
  XLSX.utils.book_append_sheet(workbook, participationSheet, "Participación");

  // Resultado agregado: votos por candidato en cada categoría, ordenado de
  // más a menos votado — la fila "Puesto" 1 de cada categoría es quien va
  // ganando. Incluye también a quien lleva 0 votos, para ver el cuadro
  // completo.
  const resultsRows: Record<string, string | number>[] = [];
  for (const category of categories) {
    const votesByCandidate = new Map<string, number>(
      category.candidates.map((c) => [c.name, 0])
    );
    for (const selection of category.selections) {
      const name = selection.candidate.name;
      votesByCandidate.set(name, (votesByCandidate.get(name) ?? 0) + 1);
    }

    const sorted = [...votesByCandidate.entries()].sort((a, b) => b[1] - a[1]);
    sorted.forEach(([name, votes], index) => {
      resultsRows.push({
        Categoría: category.name,
        Puesto: index + 1,
        Candidato: name,
        Votos: votes,
      });
    });
  }
  const resultsSheet = XLSX.utils.json_to_sheet(resultsRows);
  XLSX.utils.book_append_sheet(workbook, resultsSheet, "Resultados");

  const usedSheetNames = new Set<string>(["Participación", "Resultados"]);
  for (const category of categories) {
    const rows = category.selections.map((selection) => ({
      Participante: selection.votingSession.participant.name,
      Email: selection.votingSession.participant.email,
      Departamento: selection.votingSession.participant.department ?? "",
      "Candidato elegido": selection.candidate.name,
    }));
    const sheet = XLSX.utils.json_to_sheet(rows);
    const sheetName = sanitizeSheetName(category.name, usedSheetNames);
    XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
  }

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
  const filename = `resultados-${event.slug}.xlsx`;

  // Subida a Drive "best effort": si Drive no está conectado o falla, la
  // descarga debe funcionar igualmente — nunca bloquear al admin por esto.
  if (process.env.GOOGLE_REFRESH_TOKEN) {
    try {
      await uploadFileToDrive(
        buffer,
        filename,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    } catch (err) {
      console.error("No se pudo subir el Excel a Google Drive:", err);
    }
  }

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
