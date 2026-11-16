-- ============================================================================
-- Search tool brief fixes (Nov 16, 2026)
-- ----------------------------------------------------------------------------
--   E  engagement_alerts get a real type, timestamps, and a link to the FUB
--      outbox row that delivered them
--   C  profiles.phone so the tour / question dialog can take an optional phone
--   G  profiles.attribution (first touch UTM / referrer) and admin read access
--      to the FUB outbox, which is now the sync log on the dashboard
--   I  rolling full refresh of every active listing (stale rows from the old
--      mapping only got fixed when the listing itself changed)
--   K  purge job runs every 3 hours instead of once a day
--   L  removed_listings tombstones so a dead listing link (yard sign QR code)
--      can show similar homes or forward to the relisted record
-- ============================================================================

-- ── E. Engagement alerts ─────────────────────────────────────────────────────
alter table public.engagement_alerts
  add column if not exists alert_type   text,
  add column if not exists property_id  uuid,
  add column if not exists fub_event_id bigint references public.fub_events(id) on delete set null,
  add column if not exists notified_at  timestamptz;

update public.engagement_alerts set alert_type = case
    when ai_summary ilike 'Requested a tour%'  then 'tour_request'
    when ai_summary ilike 'Asked a question%'  then 'question'
    when ai_summary ilike 'Contacted agent%'   then 'agent_contact'
    when coalesce(drop_percentage, 0) > 0      then 'engagement_drop'
    else 'other'
  end
where alert_type is null;

update public.engagement_alerts set last_activity_date = created_at
where last_activity_date is null;

alter table public.engagement_alerts alter column alert_type set default 'other';
alter table public.engagement_alerts alter column last_activity_date set default now();
alter table public.engagement_alerts alter column created_at set default now();

create index if not exists engagement_alerts_created_idx on public.engagement_alerts (created_at desc);

-- ── C / G. Profiles ──────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists phone       text,
  add column if not exists attribution jsonb;

-- ── G. Admins can read the FUB outbox (sync log) ─────────────────────────────
drop policy if exists "Admins read fub events" on public.fub_events;
create policy "Admins read fub events"
  on public.fub_events for select
  to authenticated
  using (public.is_admin());
grant select on public.fub_events to authenticated;

-- ── L. Removed listing tombstones ────────────────────────────────────────────
create table if not exists public.removed_listings (
  id           uuid primary key,          -- the old properties.id (what links point at)
  mls_number   text,
  listing_key  text,
  address      text,
  city         text,
  zip_code     text,
  price        numeric,
  bedrooms     integer,
  bathrooms    numeric,
  property_type text,
  latitude     double precision,
  longitude    double precision,
  removed_at   timestamptz not null default now()
);
create index if not exists removed_listings_mls_idx on public.removed_listings (mls_number);

alter table public.removed_listings enable row level security;
drop policy if exists "Removed listings are public" on public.removed_listings;
create policy "Removed listings are public"
  on public.removed_listings for select
  to anon, authenticated
  using (true);
revoke all on public.removed_listings from anon, authenticated;
grant select on public.removed_listings to anon, authenticated;

create or replace function public.tombstone_removed_listing()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.removed_listings
    (id, mls_number, listing_key, address, city, zip_code, price, bedrooms, bathrooms,
     property_type, latitude, longitude, removed_at)
  values
    (old.id, old.mls_number, old.listing_key, old.address, old.city, old.zip_code, old.price,
     old.bedrooms, old.bathrooms, old.property_type, old.latitude, old.longitude, now())
  on conflict (id) do update set removed_at = excluded.removed_at;
  return old;
end;
$$;
revoke all on function public.tombstone_removed_listing() from public, anon, authenticated;

drop trigger if exists trg_tombstone_removed_listing on public.properties;
create trigger trg_tombstone_removed_listing
  after delete on public.properties
  for each row execute function public.tombstone_removed_listing();

-- ── I / K. Listing sync schedule ─────────────────────────────────────────────
-- Full RESO pass, resumable: each call continues from the saved nextLink and
-- starts a new pass when the last one completes, so every active listing is
-- rewritten with the current field mapping every few hours.
select cron.unschedule('spark-sync-full-refresh')
 where exists (select 1 from cron.job where jobname = 'spark-sync-full-refresh');
select cron.schedule(
  'spark-sync-full-refresh',
  '2-59/5 * * * *',
  $cron$
  select net.http_post(
    url := 'https://bfnudxyxgjhdqwlcqyar.supabase.co/functions/v1/syncListingsReso',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', concat('Bearer ', (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key' limit 1))
    ),
    body := '{"mode": "full"}'::jsonb,
    timeout_milliseconds := 60000
  );
  $cron$
);

-- Purge departures (withdrawn, cancelled, closed) every 3 hours.
select cron.unschedule('purge-stale-listings')
 where exists (select 1 from cron.job where jobname = 'purge-stale-listings');
select cron.schedule(
  'purge-stale-listings',
  '40 */3 * * *',
  $cron$
  select net.http_post(
    url := 'https://bfnudxyxgjhdqwlcqyar.supabase.co/functions/v1/checkInactiveListings',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', concat('Bearer ', (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key' limit 1))
    ),
    body := '{"confirmDelete": true}'::jsonb,
    timeout_milliseconds := 120000
  );
  $cron$
);
