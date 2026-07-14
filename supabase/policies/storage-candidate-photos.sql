-- Políticas de referencia para el bucket "candidate-photos" de Supabase
-- Storage. Este archivo NO se ejecuta automáticamente (no hay conexión de
-- red ni CLI de Supabase configurada en este entorno) — cópialo en el SQL
-- Editor del dashboard de tu proyecto de Supabase tras crear el bucket.
--
-- Contexto: las fotos de candidatos son el ÚNICO dato de este proyecto que
-- se lee directamente desde el cliente (navegador) usando la clave "anon"
-- (ver src/lib/supabase.ts). Todo lo demás pasa por Prisma en el servidor.
-- Por eso este bucket es el único sitio donde las políticas de Row Level
-- Security de Supabase importan de verdad.
--
-- 1. Crear el bucket "candidate-photos" como PÚBLICO desde el dashboard
--    (Storage → New bucket → Public bucket: ON).
--
-- 2. Lectura pública (cualquiera con el enlace puede ver la foto):
create policy "candidate-photos: lectura pública"
on storage.objects for select
using ( bucket_id = 'candidate-photos' );

-- 3. Escritura restringida (solo el backend, con la service_role key,
--    puede subir o borrar fotos — nunca el cliente/anon):
create policy "candidate-photos: escritura solo backend"
on storage.objects for insert
with check (
  bucket_id = 'candidate-photos'
  and auth.role() = 'service_role'
);

create policy "candidate-photos: borrado solo backend"
on storage.objects for delete
using (
  bucket_id = 'candidate-photos'
  and auth.role() = 'service_role'
);
