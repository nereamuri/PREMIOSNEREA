import { NextRequest } from "next/server";
import { exchangeGoogleAuthCode } from "@/server/services/google-drive";

function htmlPage(bodyHtml: string) {
  return new Response(
    `<!doctype html>
<html lang="es">
<head><meta charset="utf-8" /><title>Conectar Google Drive</title></head>
<body style="margin:0;background-color:#F7F2EA;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:520px;margin:64px auto;background-color:#FFFFFF;border:2.5px solid #111111;border-radius:24px;padding:32px;text-align:center;">
    ${bodyHtml}
  </div>
</body>
</html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    return htmlPage(
      `<h1 style="font-size:20px;">No se pudo conectar</h1><p>Google devolvió: ${error}</p>`
    );
  }
  if (!code) {
    return htmlPage(`<h1 style="font-size:20px;">Falta el código de autorización.</h1>`);
  }

  try {
    const { refreshToken } = await exchangeGoogleAuthCode(code);

    if (!refreshToken) {
      return htmlPage(`
        <h1 style="font-size:20px;">Ya estaba conectado</h1>
        <p style="color:#6b6b68;">
          Google no ha devuelto un token nuevo (esto pasa si ya habías
          autorizado antes). Si necesitas uno nuevo, revoca el acceso desde
          <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer">
            myaccount.google.com/permissions
          </a> y vuelve a intentarlo.
        </p>
      `);
    }

    return htmlPage(`
      <h1 style="font-size:20px;">¡Conectado!</h1>
      <p style="color:#6b6b68;font-size:14px;">
        Copia este valor en <code>.env.local</code> como
        <code>GOOGLE_REFRESH_TOKEN</code> y reinicia el servidor. Solo se
        muestra esta vez.
      </p>
      <textarea readonly rows="3" style="width:100%;box-sizing:border-box;border:2px solid #111111;border-radius:12px;padding:12px;font-family:monospace;font-size:13px;margin-top:12px;">${refreshToken}</textarea>
    `);
  } catch (err) {
    return htmlPage(
      `<h1 style="font-size:20px;">Error</h1><p>${err instanceof Error ? err.message : "Error desconocido."}</p>`
    );
  }
}
