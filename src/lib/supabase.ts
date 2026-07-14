import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Cliente público (clave anon), seguro para usarse desde el navegador.
 *
 * LÍMITE DE USO — IMPORTANTE: este cliente solo debe usarse para leer
 * archivos públicos de Supabase Storage (fotos de candidatos). NUNCA debe
 * usarse para leer o escribir en las tablas de negocio (participants,
 * voting_sessions, vote_selections, etc.). Esa lógica vive exclusivamente
 * en Prisma, en el servidor (ver src/server/services), donde puede
 * aplicarse la regla de inmutabilidad del voto y el resto de reglas de
 * negocio antes de tocar la base de datos.
 *
 * ¿Por qué? Prisma se conecta a Supabase con el rol de Postgres directo,
 * que NO pasa por las políticas de Row Level Security de Supabase. Es
 * decir: RLS no está protegiendo las tablas de este proyecto. La única
 * superficie donde RLS sí aplica es Storage (accedido vía este cliente),
 * así que ahí sí hace falta configurar políticas explícitas — ver
 * /supabase/policies/storage-candidate-photos.sql.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Cliente con permisos de servicio. SOLO para uso en servidor (API routes,
 * server actions, scripts) — nunca importar desde un componente de
 * cliente ni exponer SUPABASE_SERVICE_ROLE_KEY al navegador.
 */
export function getSupabaseServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY no está definido. Este cliente solo debe usarse en el servidor."
    );
  }
  return createClient(supabaseUrl, serviceKey);
}
