-- =====================================================================
-- CropSage AI — Initial Schema (0001_init.sql)
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
