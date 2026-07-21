import { Readable } from "node:stream";
import { google } from "googleapis";

/**
 * Scope "drive.file" (no "drive" completo): la app solo puede ver/gestionar
 * los archivos que ella misma ha creado, nunca el resto del Drive de quien
 * conecta la cuenta — mínimo privilegio necesario para subir el Excel.
 */
const SCOPES = ["https://www.googleapis.com/auth/drive.file"];
const DRIVE_FOLDER_NAME = "Premios Nerea";

function getRedirectUri(): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return `${siteUrl}/api/auth/google/callback`;
}

function getOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Faltan GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET en el servidor."
    );
  }

  return new google.auth.OAuth2(clientId, clientSecret, getRedirectUri());
}

export function getGoogleAuthUrl(): string {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    // Fuerza a que Google vuelva a dar un refresh_token incluso si ya se
    // había autorizado antes (si no, solo se entrega la primera vez).
    prompt: "consent",
    scope: SCOPES,
  });
}

export async function exchangeGoogleAuthCode(
  code: string
): Promise<{ refreshToken: string | null | undefined }> {
  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);
  return { refreshToken: tokens.refresh_token };
}

function getAuthorizedClient() {
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (!refreshToken) {
    throw new Error(
      "Google Drive no está conectado todavía (falta GOOGLE_REFRESH_TOKEN)."
    );
  }

  const client = getOAuthClient();
  client.setCredentials({ refresh_token: refreshToken });
  return client;
}

async function findOrCreateFolder(
  drive: ReturnType<typeof google.drive>
): Promise<string> {
  const existing = await drive.files.list({
    q: `name='${DRIVE_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id, name)",
    spaces: "drive",
  });

  const found = existing.data.files?.[0];
  if (found?.id) return found.id;

  const created = await drive.files.create({
    requestBody: {
      name: DRIVE_FOLDER_NAME,
      mimeType: "application/vnd.google-apps.folder",
    },
    fields: "id",
  });

  if (!created.data.id) {
    throw new Error("No se pudo crear la carpeta en Google Drive.");
  }
  return created.data.id;
}

/** Sube (o reemplaza si ya existe) el Excel de resultados a la carpeta "Premios Nerea" del Drive conectado. */
export async function uploadResultsToDrive(
  buffer: Buffer,
  filename: string
): Promise<void> {
  const auth = getAuthorizedClient();
  const drive = google.drive({ version: "v3", auth });

  const folderId = await findOrCreateFolder(drive);

  const existing = await drive.files.list({
    q: `name='${filename}' and '${folderId}' in parents and trashed=false`,
    fields: "files(id)",
    spaces: "drive",
  });

  const media = {
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    body: bufferToStream(buffer),
  };

  const existingFileId = existing.data.files?.[0]?.id;
  if (existingFileId) {
    await drive.files.update({ fileId: existingFileId, media });
  } else {
    await drive.files.create({
      requestBody: { name: filename, parents: [folderId] },
      media,
      fields: "id",
    });
  }
}

function bufferToStream(buffer: Buffer) {
  return Readable.from(buffer);
}
