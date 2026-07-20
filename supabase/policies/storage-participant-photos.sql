-- Políticas de referencia para el bucket "participant-photos" de Supabase
-- Storage. Ya se han aplicado directamente contra la base de datos (ver
-- historial de prisma/_tmp-setup-participant-storage.ts); este archivo
-- queda como documentación, igual que storage-candidate-photos.sql.
--
-- 1. Bucket "participant-photos" creado como PÚBLICO.
--
-- 2. Lectura pública (solo se usa desde el panel de admin, pero se deja
--    pública por simplicidad — no son fotos sensibles):
create policy "participant-photos: lectura pública"
on storage.objects for select
using ( bucket_id = 'participant-photos' );

-- 3. Escritura y borrado restringidos al backend (service_role):
create policy "participant-photos: escritura solo backend"
on storage.objects for insert
with check (
  bucket_id = 'participant-photos'
  and auth.role() = 'service_role'
);

create policy "participant-photos: borrado solo backend"
on storage.objects for delete
using (
  bucket_id = 'participant-photos'
  and auth.role() = 'service_role'
);
