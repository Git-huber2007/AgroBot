-- =====================================================================
-- CropSage AI — Storage Bucket Setup (0002_storage.sql)
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('crop-images', 'crop-images', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
