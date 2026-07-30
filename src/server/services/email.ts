import fs from "node:fs";
import path from "node:path";
import nodemailer from "nodemailer";
import { createEvent } from "ics";

/**
 * El logo se envía como adjunto inline referenciado por Content-ID
 * (cid:), NO como data-URI en base64 — Gmail (y otros clientes) bloquean
 * los data-URI en el HTML de emails recibidos por seguridad, aunque
 * funcionen perfectamente en una página web normal. cid: es el método
 * estándar y compatible con todos los clientes para imágenes incrustadas.
 */
const LOGO_CID = "premios-nerea-logo";
function getLogoAttachment() {
  const logoPath = path.join(process.cwd(), "public", "nereapremios.png");
  return {
    filename: "nereapremios.png",
    content: fs.readFileSync(logoPath),
    cid: LOGO_CID,
  };
}

function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    throw new Error(
      "Faltan variables SMTP_HOST / SMTP_USER / SMTP_PASSWORD en el servidor."
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

function toUtcDateArray(d: Date): [number, number, number, number, number] {
  return [
    d.getUTCFullYear(),
    d.getUTCMonth() + 1,
    d.getUTCDate(),
    d.getUTCHours(),
    d.getUTCMinutes(),
  ];
}

/** Adjunto .ics con el periodo de votación — null si el evento no tiene fechas configuradas. */
function buildCalendarAttachment(params: {
  eventName: string;
  opensAt: Date | null;
  closesAt: Date | null;
}): { filename: string; content: Buffer } | null {
  if (!params.opensAt || !params.closesAt) return null;

  const { error, value } = createEvent({
    title: `Votación abierta: ${params.eventName}`,
    description: `Periodo de votación de ${params.eventName}.`,
    start: toUtcDateArray(params.opensAt),
    end: toUtcDateArray(params.closesAt),
    startInputType: "utc",
    endInputType: "utc",
  });

  if (error || !value) return null;
  return { filename: "votacion.ics", content: Buffer.from(value) };
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "long" });
}

/**
 * HTML con estilos inline (los clientes de email no soportan CSS externo
 * ni casi nada de CSS moderno) — reutiliza los mismos colores del sistema
 * de diseño de la app, sin depender de las tipografías web (no cargan de
 * forma fiable en clientes de correo).
 */
function renderInvitationHtml(params: {
  participantName: string;
  eventName: string;
  eventDescription: string | null;
  votingLink: string;
  opensAt: Date | null;
  closesAt: Date | null;
  isReminder: boolean;
}): string {
  const hasWindow = Boolean(params.opensAt && params.closesAt);
  const closesAtText = params.closesAt ? formatDate(params.closesAt) : null;

  const intro = params.isReminder
    ? `Todavía no hemos recibido tu voto para <strong>${params.eventName}</strong> — ¡nos encantaría contar contigo!${
        closesAtText ? ` Tienes hasta el <strong>${closesAtText}</strong> para votar.` : ""
      }`
    : `Después de un año de espera, vuelven tus premios favoritos del año, los <strong>${params.eventName}</strong>. Llega el momento de hacer recap del año, recordar momentos y premiar a aquellas personas que han trabajado para tener su merecido trofeo.`;

  const windowText =
    params.opensAt && params.closesAt
      ? `Votación abierta del <strong>${formatDate(params.opensAt)}</strong> al <strong>${formatDate(params.closesAt)}</strong>.`
      : "";

  const afterButton = params.isReminder
    ? `Puedes cambiar tu voto las veces que quieras antes de enviarlo definitivamente.`
    : `Gracias por hacer posible esta tercera edición. Larga vida a los ${params.eventName}.`;

  return `
  <div style="background-color:#F7F2EA;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:480px;margin:0 auto 16px;text-align:center;">
      <div style="display:inline-block;background-color:#FFFFFF;border:2px solid #111111;border-radius:24px;padding:20px;box-shadow:5px 5px 0 0 #E0208A;">
        <img src="cid:${LOGO_CID}" width="96" height="84" alt="${params.eventName}" style="display:block;width:96px;height:auto;" />
      </div>
    </div>
    <div style="max-width:480px;margin:0 auto;background-color:#FFFFFF;border:2px solid #111111;border-radius:24px;padding:36px 32px;text-align:center;box-shadow:5px 5px 0 0 #111111;">
      ${
        params.isReminder
          ? `<h1 style="font-size:23px;font-weight:800;color:#111111;margin:0 0 18px;letter-spacing:-0.01em;">¡No te quedes sin votar!</h1>`
          : ""
      }
      <p style="font-size:15px;color:#111111;line-height:1.55;margin:0 0 14px;">
        Hola ${params.participantName},
      </p>
      <p style="font-size:15px;color:#111111;line-height:1.55;margin:0 0 14px;">
        ${intro}
      </p>
      <p style="font-size:13.5px;color:#6b6b68;line-height:1.55;margin:0 0 14px;">3ª edición</p>
      ${windowText ? `<p style="font-size:13.5px;color:#6b6b68;margin:4px 0 26px;">${windowText}</p>` : ""}
      <a href="${params.votingLink}" style="display:inline-block;background-color:#111111;color:#F7F2EA;text-decoration:none;font-weight:700;font-size:16px;padding:15px 34px;border-radius:999px;box-shadow:5px 5px 0 0 #E0208A;">
        Votar ahora
      </a>
      <p style="font-size:14px;color:#111111;line-height:1.5;margin:26px 0 0;">
        ${afterButton}
      </p>
      <p style="font-size:12px;color:#6b6b68;margin:14px 0 0;">
        Este enlace es solo tuyo — no lo compartas.
      </p>
      ${
        hasWindow
          ? `<div style="display:inline-block;margin-top:14px;font-size:12px;color:#6b6b68;background:#F7F2EA;border:1px solid #DCD5C4;border-radius:999px;padding:6px 12px;">📅 votacion.ics adjunto</div>`
          : ""
      }
    </div>
  </div>`;
}

/**
 * Igual que renderInvitationHtml, pero para mostrar en el navegador (panel
 * de admin) en vez de enviarlo como email real: el logo usa la ruta pública
 * normal en vez de la referencia cid:, que solo funciona dentro de un email
 * de verdad con su adjunto.
 */
export function renderInvitationPreviewHtml(
  params: Parameters<typeof renderInvitationHtml>[0]
): string {
  return renderInvitationHtml(params).replace(
    `cid:${LOGO_CID}`,
    "/nereapremios.png"
  );
}

export async function sendVotingInvitationEmail(params: {
  to: string;
  participantName: string;
  eventName: string;
  eventDescription: string | null;
  votingLink: string;
  opensAt: Date | null;
  closesAt: Date | null;
  isReminder: boolean;
}): Promise<void> {
  const transport = getTransport();
  const fromName = process.env.SMTP_FROM_NAME ?? "Premios Nerea";
  const fromEmail = process.env.SMTP_FROM_EMAIL ?? process.env.SMTP_USER;

  const calendarAttachment = buildCalendarAttachment({
    eventName: params.eventName,
    opensAt: params.opensAt,
    closesAt: params.closesAt,
  });

  await transport.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: params.to,
    subject: params.isReminder
      ? `¡No te quedes sin votar en ${params.eventName}! ⏰`
      : `Ya puedes votar en ${params.eventName} 🎉`,
    html: renderInvitationHtml(params),
    attachments: [
      getLogoAttachment(),
      ...(calendarAttachment ? [calendarAttachment] : []),
    ],
  });
}

export type ResultsEmailCategory = {
  id: string;
  name: string;
  winners: { id: string; name: string; photoUrl: string | null }[];
};

function renderWinnerPhoto(photoUrl: string | null, name: string): string {
  if (photoUrl) {
    return `<img src="${photoUrl}" alt="${name}" width="56" height="56" style="display:block;width:56px;height:56px;border-radius:50%;border:2px solid #111111;object-fit:cover;" />`;
  }
  return `<div style="display:flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:50%;border:2px solid #111111;background:#F7F2EA;font-weight:700;font-size:20px;">${name.charAt(0).toUpperCase()}</div>`;
}

function renderResultsHtml(params: {
  eventName: string;
  categories: ResultsEmailCategory[];
  logoSrc: string;
}): string {
  const categoriesHtml = params.categories
    .map((category) => {
      const winnersHtml = category.winners.length
        ? category.winners
            .map(
              (w) => `
              <div style="display:flex;align-items:center;gap:12px;margin-top:8px;">
                ${renderWinnerPhoto(w.photoUrl, w.name)}
                <span style="font-size:15px;font-weight:700;color:#111111;">${w.name}</span>
              </div>`
            )
            .join("")
        : `<p style="font-size:13.5px;color:#6b6b68;margin:8px 0 0;">Sin votos suficientes.</p>`;

      return `
      <div style="margin:0 0 22px;">
        <p style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:#6b6b68;margin:0;">${category.name}</p>
        ${winnersHtml}
      </div>`;
    })
    .join("");

  return `
  <div style="background-color:#F7F2EA;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:480px;margin:0 auto 16px;text-align:center;">
      <div style="display:inline-block;background-color:#FFFFFF;border:2px solid #111111;border-radius:24px;padding:20px;box-shadow:5px 5px 0 0 #E0208A;">
        <img src="${params.logoSrc}" width="96" height="84" alt="${params.eventName}" style="display:block;width:96px;height:auto;" />
      </div>
    </div>
    <div style="max-width:480px;margin:0 auto;background-color:#FFFFFF;border:2px solid #111111;border-radius:24px;padding:36px 32px;text-align:center;box-shadow:5px 5px 0 0 #111111;">
      <h1 style="font-size:23px;font-weight:800;color:#111111;margin:0 0 18px;letter-spacing:-0.01em;">¡Ya tenemos ganadores! 🏆</h1>
      <p style="font-size:15px;color:#111111;line-height:1.55;margin:0 0 22px;">
        Gracias a todos por participar en los <strong>${params.eventName}</strong>. Aquí tenéis a los ganadores de esta edición:
      </p>
      <div style="text-align:left;">
        ${categoriesHtml}
      </div>
      <p style="font-size:14px;color:#111111;line-height:1.5;margin:26px 0 0;">
        Ha sido un placer contar con vuestra participación. ¡Larga vida a los ${params.eventName} y hasta la próxima edición!
      </p>
    </div>
  </div>`;
}

export function renderResultsPreviewHtml(params: {
  eventName: string;
  categories: ResultsEmailCategory[];
}): string {
  return renderResultsHtml({ ...params, logoSrc: "/nereapremios.png" });
}

export async function sendResultsEmail(params: {
  to: string;
  eventName: string;
  categories: ResultsEmailCategory[];
}): Promise<void> {
  const transport = getTransport();
  const fromName = process.env.SMTP_FROM_NAME ?? "Premios Nerea";
  const fromEmail = process.env.SMTP_FROM_EMAIL ?? process.env.SMTP_USER;

  await transport.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: params.to,
    subject: `Resultados de ${params.eventName} 🏆`,
    html: renderResultsHtml({
      eventName: params.eventName,
      categories: params.categories,
      logoSrc: `cid:${LOGO_CID}`,
    }),
    attachments: [getLogoAttachment()],
  });
}
