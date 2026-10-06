-- =====================================================================
-- CropSage AI — Row Level Security (RLS) (0003_rls.sql)
-- =====================================================================

alter table public.profiles             enable row level security;
alter table public.crops                enable row level security;
alter table public.farms                enable row level security;
alter table public.crop_advisories      enable row level security;
alter table public.crop_recommendations enable row level security;
alter table public.pest_diagnoses       enable row level security;
alter table public.diagnosis_images     enable row level security;
alter table public.fertilizer_plans     enable row level security;
alter table public.chat_sessions        enable row level security;
alter table public.chat_messages        enable row level security;
alter table public.feedback             enable row level security;
alter table public.ai_usage_logs        enable row level security;
alter table public.weather_cache        enable row level security;  -- no policies = service role only

-- PROFILES: own row only, no insert (trigger does it), no delete (cascade from auth.users)
create policy profiles_select_own on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- CROPS: read-only catalog for any signed-in user or anonymous
create policy crops_read on public.crops for select to anon, authenticated using (is_active);

-- FARMS: full CRUD on own rows
create policy farms_select_own on public.farms for select to authenticated using (user_id = auth.uid());
create policy farms_insert_own on public.farms for insert to authenticated with check (user_id = auth.uid());
create policy farms_update_own on public.farms for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy farms_delete_own on public.farms for delete to authenticated using (user_id = auth.uid());

-- Helper: does the current user own this farm?
create or replace function public.owns_farm(fid uuid)
returns boolean language sql stable security invoker as $$
  select exists (select 1 from public.farms f where f.id = fid and f.user_id = auth.uid());
$$;

-- AI RESULT TABLES: select/insert/delete own; NO update (results are immutable)
create policy adv_select on public.crop_advisories for select to authenticated using (user_id = auth.uid());
create policy adv_insert on public.crop_advisories for insert to authenticated
  with check (user_id = auth.uid() and public.owns_farm(farm_id));
create policy adv_delete on public.crop_advisories for delete to authenticated using (user_id = auth.uid());

create policy rec_select on public.crop_recommendations for select to authenticated using (user_id = auth.uid());
create policy rec_insert on public.crop_recommendations for insert to authenticated
  with check (user_id = auth.uid() and public.owns_farm(farm_id));
create policy rec_delete on public.crop_recommendations for delete to authenticated using (user_id = auth.uid());

create policy diag_select on public.pest_diagnoses for select to authenticated using (user_id = auth.uid());
create policy diag_insert on public.pest_diagnoses for insert to authenticated
  with check (user_id = auth.uid() and (farm_id is null or public.owns_farm(farm_id)));
create policy diag_delete on public.pest_diagnoses for delete to authenticated using (user_id = auth.uid());

create policy diagimg_select on public.diagnosis_images for select to authenticated using (user_id = auth.uid());
create policy diagimg_insert on public.diagnosis_images for insert to authenticated
  with check (user_id = auth.uid() and exists (
    select 1 from public.pest_diagnoses d where d.id = diagnosis_id and d.user_id = auth.uid()));
create policy diagimg_delete on public.diagnosis_images for delete to authenticated using (user_id = auth.uid());

create policy fert_select on public.fertilizer_plans for select to authenticated using (user_id = auth.uid());
create policy fert_insert on public.fertilizer_plans for insert to authenticated
  with check (user_id = auth.uid() and public.owns_farm(farm_id));
create policy fert_delete on public.fertilizer_plans for delete to authenticated using (user_id = auth.uid());

-- CHAT
create policy cs_all_own on public.chat_sessions for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and (farm_id is null or public.owns_farm(farm_id)));
create policy cm_select on public.chat_messages for select to authenticated using (user_id = auth.uid());
create policy cm_insert on public.chat_messages for insert to authenticated
  with check (user_id = auth.uid() and exists (
    select 1 from public.chat_sessions s where s.id = session_id and s.user_id = auth.uid()));

-- FEEDBACK
create policy fb_all_own on public.feedback for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- AI USAGE LOGS: users may read their own (for quota display), never write
create policy ai_logs_select_own on public.ai_usage_logs for select to authenticated using (user_id = auth.uid());

-- STORAGE: crop-images bucket — first path segment must equal auth.uid()
create policy "crop_images_read_own" on storage.objects for select to authenticated
  using (bucket_id = 'crop-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "crop_images_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'crop-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "crop_images_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'crop-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- Revoke anon access to everything user-scoped
revoke all on all tables in schema public from anon;
grant select on public.crops to anon;  -- landing page crop count only
