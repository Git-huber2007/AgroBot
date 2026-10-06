-- =====================================================================
-- CropSage AI — Comprehensive Initial Schema Migration
-- Contains: Tables, Enums, Functions, Triggers, Views, Storage, RLS Policies & 42-Crop Catalog Seed Data
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------- ENUMS ----------
create type app_language      as enum ('en','hi','kn','mr','ta','te','bn','gu','pa');
create type crop_category     as enum ('cereal','pulse','oilseed','vegetable','fruit','spice','fibre','sugar','plantation','fodder','flower','medicinal');
create type soil_type         as enum ('alluvial','black_cotton','red','laterite','sandy','loamy','clay','saline_alkaline','forest_mountain','desert','unknown');
create type irrigation_source as enum ('rainfed','canal','borewell','open_well','tank_pond','river_lift','drip','sprinkler');
create type season            as enum ('kharif','rabi','zaid','perennial');
create type water_level       as enum ('scarce','moderate','adequate');
create type farming_practice  as enum ('conventional','organic','natural');
create type area_unit         as enum ('acre','hectare','bigha','guntha');
create type record_type       as enum ('crop_advisory','crop_recommendation','pest_diagnosis','fertilizer_plan');
create type affected_part     as enum ('leaf','stem','root','fruit','flower','seed','whole_plant');
create type ai_feature        as enum ('crop_advisory','crop_recommendation','pest_diagnosis','fertilizer_plan','chat');
create type ai_status         as enum ('success','schema_error','api_error','timeout','blocked','quota_exceeded');
create type chat_role         as enum ('user','model');

-- ---------- UTILITIES ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- PROFILES ----------
create table public.profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  full_name             text check (full_name is null or char_length(full_name) between 2 and 80),
  phone                 text check (phone is null or phone ~ '^\+?[0-9]{10,13}$'),
  preferred_language    app_language not null default 'en',
  state                 text,
  district              text,
  onboarding_completed  boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- CROP CATALOG (public reference data) ----------
create table public.crops (
  id                        integer generated always as identity primary key,
  name_en                   text not null unique,
  name_hi                   text not null,
  scientific_name           text,
  category                  crop_category not null,
  seasons                   season[] not null,
  duration_days_min         integer not null check (duration_days_min > 0),
  duration_days_max         integer not null check (duration_days_max >= duration_days_min),
  growth_stages             jsonb not null,  -- [{key,label_en,day_start,day_end}]
  water_requirement         water_level not null,
  npk_recommendation_kg_ha  jsonb not null,  -- {"N":120,"P2O5":60,"K2O":40}
  is_active                 boolean not null default true,
  created_at                timestamptz not null default now()
);

-- ---------- FARMS ----------
create table public.farms (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  name                text not null check (char_length(name) between 2 and 60),
  state               text not null,
  district            text not null,
  village             text,
  latitude            numeric(8,5) check (latitude is null or (latitude between 6 and 38)),
  longitude           numeric(8,5) check (longitude is null or (longitude between 68 and 98)),
  area_value          numeric(10,3) not null check (area_value > 0),
  area_unit           area_unit not null,
  area_hectares       numeric(10,4) not null check (area_hectares > 0),
  soil_type           soil_type not null,
  irrigation_source   irrigation_source not null,
  water_availability  water_level not null,
  farming_practice    farming_practice not null default 'conventional',
  soil_n              numeric(7,2) check (soil_n is null or (soil_n between 0 and 2000)),
  soil_p              numeric(7,2) check (soil_p is null or (soil_p between 0 and 2000)),
  soil_k              numeric(7,2) check (soil_k is null or (soil_k between 0 and 2000)),
  soil_ph             numeric(4,2) check (soil_ph is null or (soil_ph between 3 and 10.5)),
  soil_oc             numeric(4,2) check (soil_oc is null or (soil_oc between 0 and 5)),
  soil_ec             numeric(5,2) check (soil_ec is null or (soil_ec between 0 and 20)),
  soil_test_date      date check (soil_test_date is null or soil_test_date <= current_date),
  is_default          boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index idx_farms_user on public.farms(user_id);
create unique index uq_farms_one_default on public.farms(user_id) where is_default;
create trigger trg_farms_updated before update on public.farms
  for each row execute function public.set_updated_at();

-- ---------- CROP ADVISORIES ----------
create table public.crop_advisories (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  farm_id         uuid not null references public.farms(id) on delete cascade,
  crop_id         integer not null references public.crops(id),
  variety         text,
  sowing_date     date not null,
  growth_stage    text not null,
  season          season not null,
  concern         text check (concern is null or char_length(concern) <= 500),
  language        app_language not null,
  weather_snapshot jsonb,            -- summarized forecast used in prompt
  result          jsonb not null,    -- validated AI output
  model           text not null,
  prompt_version  text not null,
  created_at      timestamptz not null default now()
);
create index idx_adv_user_created on public.crop_advisories(user_id, created_at desc);

-- ---------- CROP RECOMMENDATIONS ----------
create table public.crop_recommendations (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references auth.users(id) on delete cascade,
  farm_id                  uuid not null references public.farms(id) on delete cascade,
  season                   season not null,
  sowing_month             smallint not null check (sowing_month between 1 and 12),
  water_availability       water_level not null,
  budget_min_inr_per_acre  integer not null check (budget_min_inr_per_acre >= 0),
  budget_max_inr_per_acre  integer not null check (budget_max_inr_per_acre >= budget_min_inr_per_acre),
  risk_appetite            text not null check (risk_appetite in ('low','medium','high')),
  market_access            text not null check (market_access in ('local','mandi','contract','export')),
  previous_crop_id         integer references public.crops(id),
  language                 app_language not null,
  result                   jsonb not null,
  model                    text not null,
  prompt_version           text not null,
  created_at               timestamptz not null default now()
);
create index idx_rec_user_created on public.crop_recommendations(user_id, created_at desc);

-- ---------- PEST / DISEASE DIAGNOSES ----------
create table public.pest_diagnoses (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  farm_id         uuid references public.farms(id) on delete set null,
  crop_id         integer not null references public.crops(id),
  affected_part   affected_part not null,
  symptoms        text check (symptoms is null or char_length(symptoms) <= 800),
  language        app_language not null,
  result          jsonb not null,
  top_confidence  numeric(3,2) check (top_confidence is null or (top_confidence between 0 and 1)),
  model           text not null,
  prompt_version  text not null,
  created_at      timestamptz not null default now()
);
create index idx_diag_user_created on public.pest_diagnoses(user_id, created_at desc);

create table public.diagnosis_images (
  id            uuid primary key default gen_random_uuid(),
  diagnosis_id  uuid not null references public.pest_diagnoses(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  storage_path  text not null unique,   -- {user_id}/{diagnosis_id}/{n}.{ext}
  mime_type     text not null check (mime_type in ('image/jpeg','image/png','image/webp')),
  size_bytes    integer not null check (size_bytes between 1 and 5242880),
  created_at    timestamptz not null default now(),
  constraint chk_path_owner check (split_part(storage_path,'/',1) = user_id::text)
);
create index idx_diagimg_diag on public.diagnosis_images(diagnosis_id);

-- ---------- FERTILIZER PLANS ----------
create table public.fertilizer_plans (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users(id) on delete cascade,
  farm_id                uuid not null references public.farms(id) on delete cascade,
  crop_id                integer not null references public.crops(id),
  area_hectares          numeric(10,4) not null check (area_hectares > 0),
  target_yield_t_ha      numeric(6,2),
  inputs                 jsonb not null,  -- soil values + selected fertilizers
  computed_quantities    jsonb not null,  -- deterministic calculator output
  ai_schedule            jsonb not null,  -- validated AI output
  language               app_language not null,
  model                  text not null,
  prompt_version         text not null,
  created_at             timestamptz not null default now()
);
create index idx_fert_user_created on public.fertilizer_plans(user_id, created_at desc);

-- ---------- CHAT ----------
create table public.chat_sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  farm_id          uuid references public.farms(id) on delete set null,
  title            text not null default 'New conversation' check (char_length(title) <= 80),
  language         app_language not null,
  context_summary  text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index idx_chat_sessions_user on public.chat_sessions(user_id, updated_at desc);
create trigger trg_chat_sessions_updated before update on public.chat_sessions
  for each row execute function public.set_updated_at();

create table public.chat_messages (
  id          bigint generated always as identity primary key,
  session_id  uuid not null references public.chat_sessions(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        chat_role not null,
  content     text not null check (char_length(content) between 1 and 8000),
  created_at  timestamptz not null default now()
);
create index idx_chat_messages_session on public.chat_messages(session_id, created_at);

-- ---------- FEEDBACK ----------
create table public.feedback (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  record_type  record_type not null,
  record_id    uuid not null,
  is_helpful   boolean not null,
  comment      text check (comment is null or char_length(comment) <= 500),
  created_at   timestamptz not null default now(),
  unique (user_id, record_type, record_id)
);

-- ---------- AI USAGE LOGS (server writes via service role) ----------
create table public.ai_usage_logs (
  id                 bigint generated always as identity primary key,
  user_id            uuid references auth.users(id) on delete set null,
  feature            ai_feature not null,
  model              text not null,
  status             ai_status not null,
  input_tokens       integer,
  output_tokens      integer,
  latency_ms         integer,
  error_code         text,
  request_id         text,
  created_at         timestamptz not null default now()
);
create index idx_ai_logs_user_day on public.ai_usage_logs(user_id, created_at desc);

-- ---------- WEATHER CACHE (server-only) ----------
create table public.weather_cache (
  cache_key   text primary key,   -- "lat2,lng2"
  payload     jsonb not null,
  fetched_at  timestamptz not null default now()
);

-- ---------- UNIFIED HISTORY VIEW ----------
create or replace view public.history_items with (security_invoker = true) as
  select a.id, 'crop_advisory'::record_type as record_type, a.user_id, a.farm_id, a.crop_id,
         a.result->>'summary' as title_hint, a.created_at
    from public.crop_advisories a
  union all
  select r.id, 'crop_recommendation'::record_type, r.user_id, r.farm_id, null::integer as crop_id,
         r.result->>'summary' as title_hint, r.created_at
    from public.crop_recommendations r
  union all
  select d.id, 'pest_diagnosis'::record_type, d.user_id, d.farm_id, d.crop_id,
         d.result->'primary_diagnosis'->>'name' as title_hint, d.created_at
    from public.pest_diagnoses d
  union all
  select f.id, 'fertilizer_plan'::record_type, f.user_id, f.farm_id, f.crop_id,
         f.ai_schedule->>'summary' as title_hint, f.created_at
    from public.fertilizer_plans f;

-- ---------- ATOMIC DEFAULT-FARM SWITCH ----------
create or replace function public.set_default_farm(fid uuid)
returns void language plpgsql security invoker as $$
begin
  if not exists (select 1 from public.farms where id = fid and user_id = auth.uid()) then
    raise exception 'FARM_NOT_FOUND' using errcode = 'P0002';
  end if;
  update public.farms set is_default = false where user_id = auth.uid() and is_default;
  update public.farms set is_default = true  where id = fid;
end $$;
grant execute on function public.set_default_farm(uuid) to authenticated;

-- =====================================================================
-- STORAGE BUCKETS
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('crop-images', 'crop-images', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- =====================================================================
-- ROW LEVEL SECURITY (RLS)
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
alter table public.weather_cache        enable row level security;

-- PROFILES
create policy profiles_select_own on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- CROPS
create policy crops_read on public.crops for select to anon, authenticated using (is_active);

-- FARMS
create policy farms_select_own on public.farms for select to authenticated using (user_id = auth.uid());
create policy farms_insert_own on public.farms for insert to authenticated with check (user_id = auth.uid());
create policy farms_update_own on public.farms for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy farms_delete_own on public.farms for delete to authenticated using (user_id = auth.uid());

-- HELPER
create or replace function public.owns_farm(fid uuid)
returns boolean language sql stable security invoker as $$
  select exists (select 1 from public.farms f where f.id = fid and f.user_id = auth.uid());
$$;

-- ADVISORIES
create policy adv_select on public.crop_advisories for select to authenticated using (user_id = auth.uid());
create policy adv_insert on public.crop_advisories for insert to authenticated
  with check (user_id = auth.uid() and public.owns_farm(farm_id));
create policy adv_delete on public.crop_advisories for delete to authenticated using (user_id = auth.uid());

-- RECOMMENDATIONS
create policy rec_select on public.crop_recommendations for select to authenticated using (user_id = auth.uid());
create policy rec_insert on public.crop_recommendations for insert to authenticated
  with check (user_id = auth.uid() and public.owns_farm(farm_id));
create policy rec_delete on public.crop_recommendations for delete to authenticated using (user_id = auth.uid());

-- DIAGNOSES
create policy diag_select on public.pest_diagnoses for select to authenticated using (user_id = auth.uid());
create policy diag_insert on public.pest_diagnoses for insert to authenticated
  with check (user_id = auth.uid() and (farm_id is null or public.owns_farm(farm_id)));
create policy diag_delete on public.pest_diagnoses for delete to authenticated using (user_id = auth.uid());

create policy diagimg_select on public.diagnosis_images for select to authenticated using (user_id = auth.uid());
create policy diagimg_insert on public.diagnosis_images for insert to authenticated
  with check (user_id = auth.uid() and exists (
    select 1 from public.pest_diagnoses d where d.id = diagnosis_id and d.user_id = auth.uid()));
create policy diagimg_delete on public.diagnosis_images for delete to authenticated using (user_id = auth.uid());

-- FERTILIZER PLANS
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

-- AI USAGE LOGS
create policy ai_logs_select_own on public.ai_usage_logs for select to authenticated using (user_id = auth.uid());

-- STORAGE RLS
create policy "crop_images_read_own" on storage.objects for select to authenticated
  using (bucket_id = 'crop-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "crop_images_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'crop-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "crop_images_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'crop-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- GRANTS
revoke all on all tables in schema public from anon;
grant select on public.crops to anon;

-- =====================================================================
-- SEED DATA (42 Crops Catalog)
-- =====================================================================
insert into public.crops (
  name_en, name_hi, scientific_name, category, seasons, duration_days_min, duration_days_max, growth_stages, water_requirement, npk_recommendation_kg_ha
) values
('Paddy (Rice)', 'धान (चावल)', 'Oryza sativa', 'cereal', array['kharif','rabi']::season[], 110, 150, '[{"key": "germination", "label_en": "Germination & Seedling", "day_start": 0, "day_end": 20},{"key": "tillering", "label_en": "Tillering", "day_start": 21, "day_end": 45},{"key": "panicle_initiation", "label_en": "Panicle Initiation & Stem Elongation", "day_start": 46, "day_end": 75},{"key": "flowering", "label_en": "Booting & Flowering", "day_start": 76, "day_end": 95},{"key": "grain_filling", "label_en": "Milk & Dough Stage", "day_start": 96, "day_end": 120},{"key": "maturity", "label_en": "Maturity & Harvest", "day_start": 121, "day_end": 150}]'::jsonb, 'high', '{"N": 120, "P2O5": 60, "K2O": 40}'::jsonb),
('Wheat', 'गेहूं', 'Triticum aestivum', 'cereal', array['rabi']::season[], 115, 140, '[{"key": "crown_root_initiation", "label_en": "Crown Root Initiation (CRI)", "day_start": 0, "day_end": 25},{"key": "tillering", "label_en": "Tillering", "day_start": 26, "day_end": 45},{"key": "jointing", "label_en": "Jointing", "day_start": 46, "day_end": 65},{"key": "booting_heading", "label_en": "Booting & Heading", "day_start": 66, "day_end": 85},{"key": "grain_milking", "label_en": "Milk & Dough Grain Filling", "day_start": 86, "day_end": 115},{"key": "maturity", "label_en": "Maturity & Ripening", "day_start": 116, "day_end": 140}]'::jsonb, 'moderate', '{"N": 120, "P2O5": 60, "K2O": 40}'::jsonb),
('Maize', 'मक्का', 'Zea mays', 'cereal', array['kharif','rabi','zaid']::season[], 90, 120, '[{"key": "emergence", "label_en": "Emergence & Seedling (V2-V4)", "day_start": 0, "day_end": 20},{"key": "knee_high", "label_en": "Knee High (V6-V8)", "day_start": 21, "day_end": 40},{"key": "tasseling_silking", "label_en": "Tasseling & Silking", "day_start": 41, "day_end": 65},{"key": "grain_filling", "label_en": "Blister & Dough Stage", "day_start": 66, "day_end": 90},{"key": "physiological_maturity", "label_en": "Physiological Maturity", "day_start": 91, "day_end": 120}]'::jsonb, 'moderate', '{"N": 120, "P2O5": 60, "K2O": 50}'::jsonb),
('Sorghum (Jowar)', 'ज्वार', 'Sorghum bicolor', 'cereal', array['kharif','rabi']::season[], 95, 125, '[{"key": "seedling", "label_en": "Seedling Establishment", "day_start": 0, "day_end": 20},{"key": "vegetative", "label_en": "Vegetative Growth", "day_start": 21, "day_end": 45},{"key": "booting_flowering", "label_en": "Booting & Flowering", "day_start": 46, "day_end": 70},{"key": "grain_filling", "label_en": "Grain Development", "day_start": 71, "day_end": 95},{"key": "maturity", "label_en": "Harvest Maturity", "day_start": 96, "day_end": 125}]'::jsonb, 'scarce', '{"N": 80, "P2O5": 40, "K2O": 40}'::jsonb),
('Pearl Millet (Bajra)', 'बाजरा', 'Pennisetum glaucum', 'cereal', array['kharif','zaid']::season[], 75, 95, '[{"key": "seedling", "label_en": "Seedling Emergence", "day_start": 0, "day_end": 18},{"key": "tillering", "label_en": "Tillering & Stem Elongation", "day_start": 19, "day_end": 40},{"key": "flowering", "label_en": "Heading & Flowering", "day_start": 41, "day_end": 55},{"key": "grain_filling", "label_en": "Grain Filling", "day_start": 56, "day_end": 75},{"key": "maturity", "label_en": "Maturity & Harvesting", "day_start": 76, "day_end": 95}]'::jsonb, 'scarce', '{"N": 60, "P2O5": 30, "K2O": 20}'::jsonb),
('Finger Millet (Ragi)', 'रागी', 'Eleusine coracana', 'cereal', array['kharif','rabi']::season[], 105, 130, '[{"key": "nursery_seedling", "label_en": "Nursery & Seedling", "day_start": 0, "day_end": 25},{"key": "tillering", "label_en": "Tillering", "day_start": 26, "day_end": 50},{"key": "heading", "label_en": "Heading & Flowering", "day_start": 51, "day_end": 75},{"key": "grain_formation", "label_en": "Grain Development", "day_start": 76, "day_end": 105},{"key": "maturity", "label_en": "Maturity", "day_start": 106, "day_end": 130}]'::jsonb, 'scarce', '{"N": 50, "P2O5": 40, "K2O": 25}'::jsonb),
('Chickpea (Gram)', 'चना', 'Cicer arietinum', 'pulse', array['rabi']::season[], 90, 120, '[{"key": "germination", "label_en": "Germination & Early Vegetative", "day_start": 0, "day_end": 25},{"key": "branching", "label_en": "Branching", "day_start": 26, "day_end": 50},{"key": "flowering", "label_en": "Flowering & Pod Initiation", "day_start": 51, "day_end": 75},{"key": "pod_filling", "label_en": "Pod Filling & Seed Development", "day_start": 76, "day_end": 100},{"key": "maturity", "label_en": "Harvest Maturity", "day_start": 101, "day_end": 120}]'::jsonb, 'scarce', '{"N": 20, "P2O5": 40, "K2O": 20}'::jsonb),
('Pigeon Pea (Tur/Arhar)', 'अरहर (तूर)', 'Cajanus cajan', 'pulse', array['kharif']::season[], 150, 200, '[{"key": "seedling", "label_en": "Seedling Emergence", "day_start": 0, "day_end": 30},{"key": "vegetative", "label_en": "Active Vegetative & Branching", "day_start": 31, "day_end": 80},{"key": "flowering", "label_en": "Flower Bud & Flowering", "day_start": 81, "day_end": 125},{"key": "pod_development", "label_en": "Pod Development", "day_start": 126, "day_end": 165},{"key": "maturity", "label_en": "Pod Ripening & Harvest", "day_start": 166, "day_end": 200}]'::jsonb, 'scarce', '{"N": 25, "P2O5": 50, "K2O": 20}'::jsonb),
('Green Gram (Moong)', 'मूंग', 'Vigna radiata', 'pulse', array['kharif','zaid']::season[], 60, 75, '[{"key": "seedling", "label_en": "Seedling", "day_start": 0, "day_end": 15},{"key": "vegetative", "label_en": "Branching & Vegetative", "day_start": 16, "day_end": 30},{"key": "flowering", "label_en": "Flowering", "day_start": 31, "day_end": 45},{"key": "pod_filling", "label_en": "Pod Maturation", "day_start": 46, "day_end": 60},{"key": "maturity", "label_en": "Harvest", "day_start": 61, "day_end": 75}]'::jsonb, 'scarce', '{"N": 20, "P2O5": 40, "K2O": 20}'::jsonb),
('Black Gram (Urad)', 'उड़द', 'Vigna mungo', 'pulse', array['kharif','zaid']::season[], 70, 85, '[{"key": "seedling", "label_en": "Seedling", "day_start": 0, "day_end": 18},{"key": "vegetative", "label_en": "Vegetative & Branching", "day_start": 19, "day_end": 35},{"key": "flowering", "label_en": "Flowering & Pod Setting", "day_start": 36, "day_end": 55},{"key": "pod_filling", "label_en": "Pod Development", "day_start": 56, "day_end": 70},{"key": "maturity", "label_en": "Harvesting", "day_start": 71, "day_end": 85}]'::jsonb, 'scarce', '{"N": 20, "P2O5": 40, "K2O": 20}'::jsonb),
('Lentil (Masoor)', 'मसूर', 'Lens culinaris', 'pulse', array['rabi']::season[], 110, 130, '[{"key": "seedling", "label_en": "Germination & Seedling", "day_start": 0, "day_end": 25},{"key": "vegetative", "label_en": "Branching", "day_start": 26, "day_end": 55},{"key": "flowering", "label_en": "Flowering", "day_start": 56, "day_end": 85},{"key": "pod_filling", "label_en": "Pod Filling", "day_start": 86, "day_end": 110},{"key": "maturity", "label_en": "Maturity", "day_start": 111, "day_end": 130}]'::jsonb, 'scarce', '{"N": 20, "P2O5": 40, "K2O": 20}'::jsonb),
('Groundnut', 'मूंगफली', 'Arachis hypogaea', 'oilseed', array['kharif','zaid']::season[], 105, 125, '[{"key": "seedling", "label_en": "Emergence & Seedling", "day_start": 0, "day_end": 20},{"key": "vegetative", "label_en": "Vegetative & Flowering", "day_start": 21, "day_end": 40},{"key": "pegging", "label_en": "Pegging (Crucial Stage)", "day_start": 41, "day_end": 65},{"key": "pod_development", "label_en": "Pod Development", "day_start": 66, "day_end": 95},{"key": "maturity", "label_en": "Harvest Maturity", "day_start": 96, "day_end": 125}]'::jsonb, 'moderate', '{"N": 25, "P2O5": 50, "K2O": 40}'::jsonb),
('Soybean', 'सोयाबीन', 'Glycine max', 'oilseed', array['kharif']::season[], 90, 110, '[{"key": "seedling", "label_en": "Emergence (VE-V2)", "day_start": 0, "day_end": 18},{"key": "vegetative", "label_en": "Vegetative (V3-V5)", "day_start": 19, "day_end": 35},{"key": "flowering", "label_en": "Flowering (R1-R2)", "day_start": 36, "day_end": 55},{"key": "pod_development", "label_en": "Pod Development (R3-R5)", "day_start": 56, "day_end": 85},{"key": "maturity", "label_en": "Full Maturity (R7-R8)", "day_start": 86, "day_end": 110}]'::jsonb, 'moderate', '{"N": 30, "P2O5": 60, "K2O": 40}'::jsonb),
('Mustard', 'सरसों', 'Brassica juncea', 'oilseed', array['rabi']::season[], 105, 130, '[{"key": "seedling", "label_en": "Seedling", "day_start": 0, "day_end": 25},{"key": "rosette_stem", "label_en": "Rosette & Stem Elongation", "day_start": 26, "day_end": 50},{"key": "flowering", "label_en": "Flowering", "day_start": 51, "day_end": 75},{"key": "siliqua_development", "label_en": "Siliqua (Pod) Formation", "day_start": 76, "day_end": 105},{"key": "maturity", "label_en": "Maturity", "day_start": 106, "day_end": 130}]'::jsonb, 'moderate', '{"N": 80, "P2O5": 40, "K2O": 40}'::jsonb),
('Sunflower', 'सूरजमुखी', 'Helianthus annuus', 'oilseed', array['kharif','rabi','zaid']::season[], 85, 100, '[{"key": "seedling", "label_en": "Emergence & Seedling", "day_start": 0, "day_end": 20},{"key": "vegetative", "label_en": "Stem & Foliage Development", "day_start": 21, "day_end": 40},{"key": "star_bud_flowering", "label_en": "Star Bud & Flowering (Anthesis)", "day_start": 41, "day_end": 65},{"key": "seed_filling", "label_en": "Achene (Seed) Filling", "day_start": 66, "day_end": 85},{"key": "maturity", "label_en": "Harvest Maturity", "day_start": 86, "day_end": 100}]'::jsonb, 'moderate', '{"N": 60, "P2O5": 60, "K2O": 40}'::jsonb),
('Sesame', 'तिल', 'Sesamum indicum', 'oilseed', array['kharif','zaid']::season[], 80, 95, '[{"key": "seedling", "label_en": "Seedling", "day_start": 0, "day_end": 20},{"key": "vegetative", "label_en": "Branching & Leaf Growth", "day_start": 21, "day_end": 40},{"key": "flowering", "label_en": "Flowering & Capsule Initiation", "day_start": 41, "day_end": 65},{"key": "capsule_maturation", "label_en": "Capsule Maturation", "day_start": 66, "day_end": 80},{"key": "maturity", "label_en": "Harvesting", "day_start": 81, "day_end": 95}]'::jsonb, 'scarce', '{"N": 40, "P2O5": 30, "K2O": 20}'::jsonb),
('Cotton', 'कपास', 'Gossypium hirsutum', 'fibre', array['kharif']::season[], 150, 180, '[{"key": "seedling", "label_en": "Germination & Seedling", "day_start": 0, "day_end": 30},{"key": "squaring", "label_en": "Vegetative & Squaring (Square Formation)", "day_start": 31, "day_end": 65},{"key": "flowering_boll", "label_en": "Flowering & Early Boll Setting", "day_start": 66, "day_end": 105},{"key": "boll_development", "label_en": "Boll Development & Maturation", "day_start": 106, "day_end": 140},{"key": "boll_bursting", "label_en": "Boll Bursting & Picking", "day_start": 141, "day_end": 180}]'::jsonb, 'moderate', '{"N": 120, "P2O5": 60, "K2O": 60}'::jsonb),
('Jute', 'जूट / पटसन', 'Corchorus olitorius', 'fibre', array['kharif','zaid']::season[], 110, 135, '[{"key": "seedling", "label_en": "Seedling", "day_start": 0, "day_end": 25},{"key": "vegetative", "label_en": "Active Vegetative & Fibre Elongation", "day_start": 26, "day_end": 80},{"key": "small_pod", "label_en": "Small Pod / Pre-Flowering", "day_start": 81, "day_end": 110},{"key": "maturity_harvest", "label_en": "Harvest (Optimal Fibre Quality)", "day_start": 111, "day_end": 135}]'::jsonb, 'high', '{"N": 60, "P2O5": 30, "K2O": 30}'::jsonb),
('Sugarcane', 'गन्ना', 'Saccharum officinarum', 'sugar', array['perennial']::season[], 300, 365, '[{"key": "germination", "label_en": "Germination Phase", "day_start": 0, "day_end": 45},{"key": "formative", "label_en": "Formative & Tillering Phase", "day_start": 46, "day_end": 120},{"key": "grand_growth", "label_en": "Grand Growth Phase (Cane Elongation)", "day_start": 121, "day_end": 250},{"key": "ripening", "label_en": "Ripening & Sugar Accumulation", "day_start": 251, "day_end": 365}]'::jsonb, 'high', '{"N": 250, "P2O5": 100, "K2O": 120}'::jsonb),
('Tomato', 'टमाटर', 'Solanum lycopersicum', 'vegetable', array['kharif','rabi','zaid']::season[], 90, 130, '[{"key": "nursery_transplanting", "label_en": "Nursery & Transplanting", "day_start": 0, "day_end": 25},{"key": "vegetative", "label_en": "Early Vegetative Growth", "day_start": 26, "day_end": 45},{"key": "flowering_fruit_set", "label_en": "Flowering & Fruit Setting", "day_start": 46, "day_end": 75},{"key": "fruit_development", "label_en": "Fruit Enlargement", "day_start": 76, "day_end": 100},{"key": "harvesting", "label_en": "Fruit Ripening & Multiple Pickings", "day_start": 101, "day_end": 130}]'::jsonb, 'moderate', '{"N": 100, "P2O5": 60, "K2O": 60}'::jsonb),
('Potato', 'आलू', 'Solanum tuberosum', 'vegetable', array['rabi']::season[], 90, 120, '[{"key": "sprouting", "label_en": "Sprout Emergence", "day_start": 0, "day_end": 20},{"key": "vegetative", "label_en": "Vegetative & Canopy Growth", "day_start": 21, "day_end": 45},{"key": "tuber_initiation", "label_en": "Tuber Initiation", "day_start": 46, "day_end": 65},{"key": "tuber_bulking", "label_en": "Tuber Bulking", "day_start": 66, "day_end": 95},{"key": "maturity", "label_en": "Maturity & Skin Hardening", "day_start": 96, "day_end": 120}]'::jsonb, 'moderate', '{"N": 150, "P2O5": 100, "K2O": 120}'::jsonb),
('Onion', 'प्याज', 'Allium cepa', 'vegetable', array['kharif','rabi']::season[], 120, 150, '[{"key": "nursery_seedling", "label_en": "Nursery & Transplanting", "day_start": 0, "day_end": 45},{"key": "vegetative", "label_en": "Vegetative Leaf Growth", "day_start": 46, "day_end": 80},{"key": "bulb_initiation", "label_en": "Bulb Initiation & Development", "day_start": 81, "day_end": 115},{"key": "maturity_harvest", "label_en": "Neck Fall & Harvest Maturity", "day_start": 116, "day_end": 150}]'::jsonb, 'moderate', '{"N": 100, "P2O5": 50, "K2O": 80}'::jsonb),
('Brinjal (Eggplant)', 'बैंगन', 'Solanum melongena', 'vegetable', array['kharif','rabi','zaid']::season[], 120, 160, '[{"key": "nursery", "label_en": "Nursery & Transplanting", "day_start": 0, "day_end": 30},{"key": "vegetative", "label_en": "Vegetative & Branching", "day_start": 31, "day_end": 60},{"key": "flowering_fruit_set", "label_en": "Flowering & Fruit Set", "day_start": 61, "day_end": 90},{"key": "fruiting_picking", "label_en": "Continuous Fruit Pickings", "day_start": 91, "day_end": 160}]'::jsonb, 'moderate', '{"N": 100, "P2O5": 50, "K2O": 50}'::jsonb),
('Chilli', 'मिर्च', 'Capsicum annuum', 'spice', array['kharif','rabi','zaid']::season[], 120, 180, '[{"key": "nursery", "label_en": "Nursery & Transplanting", "day_start": 0, "day_end": 35},{"key": "vegetative", "label_en": "Vegetative Growth", "day_start": 36, "day_end": 65},{"key": "flowering", "label_en": "Flowering & Pod Initiation", "day_start": 66, "day_end": 95},{"key": "fruiting_picking", "label_en": "Fruit Ripening & Pickings", "day_start": 96, "day_end": 180}]'::jsonb, 'moderate', '{"N": 120, "P2O5": 60, "K2O": 60}'::jsonb),
('Okra (Bhindi)', 'भिंडी', 'Abelmoschus esculentus', 'vegetable', array['kharif','zaid']::season[], 80, 100, '[{"key": "seedling", "label_en": "Germination & Seedling", "day_start": 0, "day_end": 18},{"key": "vegetative", "label_en": "Vegetative Growth", "day_start": 19, "day_end": 35},{"key": "flowering", "label_en": "Flowering & Pod Set", "day_start": 36, "day_end": 50},{"key": "fruiting_picking", "label_en": "Regular Pod Picking", "day_start": 51, "day_end": 100}]'::jsonb, 'moderate', '{"N": 80, "P2O5": 50, "K2O": 50}'::jsonb),
('Cabbage', 'पत्तागोभी', 'Brassica oleracea var. capitata', 'vegetable', array['rabi']::season[], 85, 110, '[{"key": "nursery", "label_en": "Nursery & Transplanting", "day_start": 0, "day_end": 25},{"key": "vegetative", "label_en": "Vegetative & Foliage Development", "day_start": 26, "day_end": 50},{"key": "head_formation", "label_en": "Head Formation & Cupping", "day_start": 51, "day_end": 80},{"key": "maturity", "label_en": "Head Firmness & Harvest", "day_start": 81, "day_end": 110}]'::jsonb, 'moderate', '{"N": 120, "P2O5": 60, "K2O": 60}'::jsonb),
('Cauliflower', 'फूलगोभी', 'Brassica oleracea var. botrytis', 'vegetable', array['rabi']::season[], 85, 115, '[{"key": "nursery", "label_en": "Nursery & Transplanting", "day_start": 0, "day_end": 28},{"key": "vegetative", "label_en": "Vegetative Growth", "day_start": 29, "day_end": 55},{"key": "curd_initiation", "label_en": "Curd Initiation & Blanching", "day_start": 56, "day_end": 85},{"key": "maturity", "label_en": "Curd Harvest", "day_start": 86, "day_end": 115}]'::jsonb, 'moderate', '{"N": 120, "P2O5": 80, "K2O": 60}'::jsonb),
('Cucumber', 'खीरा', 'Cucumis sativus', 'vegetable', array['zaid','kharif']::season[], 60, 80, '[{"key": "seedling", "label_en": "Emergence & Seedling", "day_start": 0, "day_end": 15},{"key": "vining", "label_en": "Vine Growth & Trellising", "day_start": 16, "day_end": 35},{"key": "flowering_fruit_set", "label_en": "Flowering & Fruit Setting", "day_start": 36, "day_end": 50},{"key": "harvesting", "label_en": "Fruit Picking", "day_start": 51, "day_end": 80}]'::jsonb, 'moderate', '{"N": 80, "P2O5": 50, "K2O": 50}'::jsonb),
('Banana', 'केला', 'Musa acuminata', 'fruit', array['perennial']::season[], 300, 365, '[{"key": "establishment", "label_en": "Sucker / Plantlet Establishment", "day_start": 0, "day_end": 90},{"key": "vegetative", "label_en": "Active Vegetative (Shooting Phase)", "day_start": 91, "day_end": 210},{"key": "flowering_shooting", "label_en": "Inflorescence & Bunch Emergence", "day_start": 211, "day_end": 270},{"key": "bunch_development", "label_en": "Bunch Maturation & Harvest", "day_start": 271, "day_end": 365}]'::jsonb, 'high', '{"N": 200, "P2O5": 60, "K2O": 300}'::jsonb),
('Mango', 'आम', 'Mangifera indica', 'fruit', array['perennial']::season[], 365, 365, '[{"key": "dormancy", "label_en": "Post-Monsoon Dormancy", "day_start": 0, "day_end": 60},{"key": "panicle_bloom", "label_en": "Panicle Emergence & Flowering", "day_start": 61, "day_end": 120},{"key": "fruit_set", "label_en": "Fruit Setting & Pea/Marble Stage", "day_start": 121, "day_end": 180},{"key": "fruit_development", "label_en": "Fruit Enlargement & Maturation", "day_start": 181, "day_end": 270},{"key": "harvest", "label_en": "Harvesting & Post-Harvest Flush", "day_start": 271, "day_end": 365}]'::jsonb, 'moderate', '{"N": 100, "P2O5": 50, "K2O": 100}'::jsonb),
('Papaya', 'पपीता', 'Carica papaya', 'fruit', array['perennial']::season[], 240, 330, '[{"key": "nursery_establishment", "label_en": "Transplanting & Establishment", "day_start": 0, "day_end": 45},{"key": "vegetative", "label_en": "Rapid Vegetative Growth", "day_start": 46, "day_end": 105},{"key": "flowering_fruiting", "label_en": "Flowering & Fruit Setting", "day_start": 106, "day_end": 180},{"key": "fruit_maturation", "label_en": "Fruit Development & Harvest", "day_start": 181, "day_end": 330}]'::jsonb, 'high', '{"N": 150, "P2O5": 150, "K2O": 200}'::jsonb),
('Pomegranate', 'अनार', 'Punica granatum', 'fruit', array['perennial']::season[], 300, 365, '[{"key": "defoliation_bahar", "label_en": "Bahar Treatment & Pruning", "day_start": 0, "day_end": 30},{"key": "flowering", "label_en": "Flushing & Flowering", "day_start": 31, "day_end": 90},{"key": "fruit_development", "label_en": "Fruit Setting & Growth", "day_start": 91, "day_end": 210},{"key": "maturity", "label_en": "Fruit Maturation & Coloration", "day_start": 211, "day_end": 365}]'::jsonb, 'moderate', '{"N": 125, "P2O5": 50, "K2O": 125}'::jsonb),
('Grapes', 'अंगूर', 'Vitis vinifera', 'fruit', array['perennial']::season[], 300, 365, '[{"key": "pruning_bud_burst", "label_en": "Foundation/Fruit Pruning & Bud Burst", "day_start": 0, "day_end": 40},{"key": "shoot_bloom", "label_en": "Shoot Elongation & Flowering", "day_start": 41, "day_end": 90},{"key": "berry_setting", "label_en": "Berry Setting & Thinning", "day_start": 91, "day_end": 140},{"key": "veraison", "label_en": "Veraison (Berry Softening & Color)", "day_start": 141, "day_end": 200},{"key": "harvest", "label_en": "Harvesting", "day_start": 201, "day_end": 365}]'::jsonb, 'moderate', '{"N": 150, "P2O5": 80, "K2O": 200}'::jsonb),
('Coconut', 'नारियल', 'Cocos nucifera', 'plantation', array['perennial']::season[], 365, 365, '[{"key": "inflorescence", "label_en": "Spathe Opening & Button Setting", "day_start": 0, "day_end": 90},{"key": "nut_development", "label_en": "Tender Nut Phase", "day_start": 91, "day_end": 240},{"key": "kernel_maturation", "label_en": "Copra & Shell Hardening", "day_start": 241, "day_end": 365}]'::jsonb, 'high', '{"N": 100, "P2O5": 50, "K2O": 150}'::jsonb),
('Arecanut', 'सुपारी', 'Areca catechu', 'plantation', array['perennial']::season[], 365, 365, '[{"key": "spathe_opening", "label_en": "Spathe Opening & Pollination", "day_start": 0, "day_end": 80},{"key": "nut_setting", "label_en": "Nut Setting & Growth", "day_start": 81, "day_end": 220},{"key": "harvest", "label_en": "Nut Maturation & Harvesting", "day_start": 221, "day_end": 365}]'::jsonb, 'high', '{"N": 100, "P2O5": 40, "K2O": 140}'::jsonb),
('Coffee', 'कॉफ़ी', 'Coffea arabica', 'plantation', array['perennial']::season[], 300, 365, '[{"key": "blossom", "label_en": "Blossom & Backing Shower", "day_start": 0, "day_end": 45},{"key": "berry_development", "label_en": "Berry Expansion & Bean Filling", "day_start": 46, "day_end": 200},{"key": "ripening_picking", "label_en": "Ripening & Fly Picking", "day_start": 201, "day_end": 365}]'::jsonb, 'moderate', '{"N": 120, "P2O5": 90, "K2O": 120}'::jsonb),
('Tea', 'चाय', 'Camellia sinensis', 'plantation', array['perennial']::season[], 300, 365, '[{"key": "dormancy_pruning", "label_en": "Dormancy & Pruning", "day_start": 0, "day_end": 60},{"key": "first_flush", "label_en": "First Flush (Early Spring Plucking)", "day_start": 61, "day_end": 140},{"key": "monsoon_flush", "label_en": "Monsoon Flush & Active Foliage", "day_start": 141, "day_end": 250},{"key": "autumn_flush", "label_en": "Autumn Flush Plucking", "day_start": 251, "day_end": 365}]'::jsonb, 'high', '{"N": 140, "P2O5": 40, "K2O": 80}'::jsonb),
('Turmeric', 'हल्दी', 'Curcuma longa', 'spice', array['kharif']::season[], 240, 270, '[{"key": "sprouting", "label_en": "Rhizome Sprouting", "day_start": 0, "day_end": 30},{"key": "vegetative", "label_en": "Tillering & Leaf Development", "day_start": 31, "day_end": 90},{"key": "rhizome_development", "label_en": "Rhizome Bulking", "day_start": 91, "day_end": 180},{"key": "maturity", "label_en": "Leaf Senescence & Harvest", "day_start": 181, "day_end": 270}]'::jsonb, 'moderate', '{"N": 120, "P2O5": 60, "K2O": 120}'::jsonb),
('Ginger', 'अदरक', 'Zingiber officinale', 'spice', array['kharif']::season[], 210, 240, '[{"key": "sprouting", "label_en": "Sprouting & Establishment", "day_start": 0, "day_end": 35},{"key": "tillering", "label_en": "Tillering & Canopy Growth", "day_start": 36, "day_end": 95},{"key": "rhizome_bulking", "label_en": "Rhizome Enlargement", "day_start": 96, "day_end": 175},{"key": "maturity", "label_en": "Maturity & Harvesting", "day_start": 176, "day_end": 240}]'::jsonb, 'moderate', '{"N": 100, "P2O5": 50, "K2O": 80}'::jsonb),
('Garlic', 'लहसुन', 'Allium sativum', 'spice', array['rabi']::season[], 120, 150, '[{"key": "germination", "label_en": "Clove Sprouting", "day_start": 0, "day_end": 20},{"key": "vegetative", "label_en": "Vegetative Foliage Growth", "day_start": 21, "day_end": 60},{"key": "clove_initiation", "label_en": "Clove Initiation & Bulb Growth", "day_start": 61, "day_end": 105},{"key": "maturity", "label_en": "Maturity & Drying", "day_start": 106, "day_end": 150}]'::jsonb, 'moderate', '{"N": 100, "P2O5": 50, "K2O": 50}'::jsonb),
('Coriander', 'धनिया', 'Coriandrum sativum', 'spice', array['rabi','kharif']::season[], 75, 90, '[{"key": "seedling", "label_en": "Germination & Seedling", "day_start": 0, "day_end": 20},{"key": "vegetative", "label_en": "Rosette & Foliage Growth", "day_start": 21, "day_end": 45},{"key": "flowering", "label_en": "Bolting & Umbel Flowering", "day_start": 46, "day_end": 65},{"key": "seed_formation", "label_en": "Seed Ripening & Harvest", "day_start": 66, "day_end": 90}]'::jsonb, 'scarce', '{"N": 40, "P2O5": 30, "K2O": 20}'::jsonb),
('Marigold', 'गेंदा', 'Tagetes erecta', 'flower', array['kharif','rabi','zaid']::season[], 70, 90, '[{"key": "nursery", "label_en": "Nursery & Seedling Establishment", "day_start": 0, "day_end": 20},{"key": "vegetative_pinch", "label_en": "Vegetative & Terminal Pinching", "day_start": 21, "day_end": 40},{"key": "budding_bloom", "label_en": "Bud Initiation & Flowering", "day_start": 41, "day_end": 65},{"key": "multiple_pickings", "label_en": "Flower Plucking & Harvest", "day_start": 66, "day_end": 90}]'::jsonb, 'scarce', '{"N": 60, "P2O5": 60, "K2O": 40}'::jsonb)
on conflict (name_en) do update set
  name_hi = excluded.name_hi,
  scientific_name = excluded.scientific_name,
  category = excluded.category,
  seasons = excluded.seasons,
  duration_days_min = excluded.duration_days_min,
  duration_days_max = excluded.duration_days_max,
  growth_stages = excluded.growth_stages,
  water_requirement = excluded.water_requirement,
  npk_recommendation_kg_ha = excluded.npk_recommendation_kg_ha;
