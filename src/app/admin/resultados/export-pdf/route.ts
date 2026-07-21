import { getActiveEvent } from "@/server/services/admin/categories";
import { getCeremonyData } from "@/server/services/admin/ceremony";
import { generateWinnersPdf } from "@/server/services/winners-pdf";
import { uploadFileToDrive } from "@/server/services/google-drive";

export async function GET() {
  const event = await getActiveEvent();
  const categories = await getCeremonyData(event.id);

  const buffer = await generateWinnersPdf(event.name, categories);
  const filename = `ganadores-${event.slug}.pdf`;

  if (process.env.GOOGLE_REFRESH_TOKEN) {
    try {
      await uploadFileToDrive(buffer, filename, "application/pdf");
    } catch (err) {
      console.error("No se pudo subir el PDF de ganadores a Google Drive:", err);
    }
  }

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
