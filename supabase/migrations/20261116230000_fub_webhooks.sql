-- ============================================================================
-- Follow Up Boss webhooks: FUB → HomeFind
-- ----------------------------------------------------------------------------
-- FUB tells us when a contact changes (agent reassigned, stage moved, tags
-- edited, deleted). The payload is only a pointer ({event, resourceIds, uri}),
-- so we follow FUB's recommended split:
--
--   FUB  ──POST──▶  fubWebhook (verify FUB-Signature, store row, 200 fast)
--                        │
--                        ▼
--               public.fub_webhook_events (status = 'pending')
--                        │  pg_cron every minute → processFubWebhooks
--                        ▼
--   GET /v1/people?id=… → public.fub_contacts (mirror for app users)
--                       → public.fub_users    (agents, for "your agent" UI)
--
-- Webhooks are registered with the fubWebhooks admin function.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Inbound webhook log (the inbox). eventId is FUB's UUID: unique so FUB's
-- retries of the same delivery are stored once.
-- ----------------------------------------------------------------------------
create table if not exists public.fub_webhook_events (
  id              bigint generated always as identity primary key,
  event_id        text not null unique,
  event           text not null,
  resource_ids    bigint[] not null default '{}',
  uri             text,
  data            jsonb,
  event_created   timestamptz,
  status          text not null default 'pending'
                    check (status in ('pending', 'processing', 'processed', 'failed', 'ignored')),
  attempts        integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  locked_at       timestamptz,
  last_error      text,
  received_at     timestamptz not null default now(),
  processed_at    timestamptz
);

create index if not exists fub_webhook_events_due_idx
  on public.fub_webhook_events (next_attempt_at)
  where status = 'pending';

alter table public.fub_webhook_events enable row level security;
revoke all on public.fub_webhook_events from anon, authenticated;

create or replace function public.fub_claim_webhook_events(p_limit integer default 25)
returns setof public.fub_webhook_events
language sql
security definer
set search_path = public
as $$
  update public.fub_webhook_events e
     set status = 'processing', locked_at = now()
   where e.id in (
     select id from public.fub_webhook_events
      where (status = 'pending' and next_attempt_at <= now())
         or (status = 'processing' and locked_at < now() - interval '10 minutes')
      order by next_attempt_at
      limit p_limit
      for update skip locked
   )
  returning e.*;
$$;

revoke all on function public.fub_claim_webhook_events(integer) from public, anon, authenticated;
grant execute on function public.fub_claim_webhook_events(integer) to service_role;

-- ----------------------------------------------------------------------------
-- FUB users (agents/lenders). Readable by signed-in users so the app can show
-- a buyer who their agent is. Written by the service role only.
-- ----------------------------------------------------------------------------
create table if not exists public.fub_users (
  id         bigint primary key,
  name       text,
  first_name text,
  last_name  text,
  email      text,
  phone      text,
  role       text,
  status     text,
  synced_at  timestamptz not null default now()
);

alter table public.fub_users enable row level security;
revoke all on public.fub_users from anon, authenticated;
grant select on public.fub_users to authenticated;

drop policy if exists fub_users_read on public.fub_users;
create policy fub_users_read on public.fub_users
  for select to authenticated using (true);

-- ----------------------------------------------------------------------------
-- FUB contact mirror, one row per app user who exists in FUB. Kept in a
-- separate table (not profiles) so buyers can never write CRM state and the
-- profiles privileged-column guard stays simple.
-- ----------------------------------------------------------------------------
create table if not exists public.fub_contacts (
  profile_id           uuid primary key references public.profiles(id) on delete cascade,
  fub_person_id        bigint not null unique,
  stage                text,
  stage_id             integer,
  assigned_user_id     bigint,
  assigned_to          text,
  assigned_lender_id   bigint,
  assigned_lender_name text,
  tags                 text[] not null default '{}',
  contacted            boolean,
  fub_updated_at       timestamptz,
  synced_at            timestamptz not null default now()
);

create index if not exists fub_contacts_assigned_idx on public.fub_contacts (assigned_user_id);

alter table public.fub_contacts enable row level security;
revoke all on public.fub_contacts from anon, authenticated;
grant select on public.fub_contacts to authenticated;

drop policy if exists fub_contacts_read_own on public.fub_contacts;
create policy fub_contacts_read_own on public.fub_contacts
  for select to authenticated using (profile_id = auth.uid() or public.is_admin());

-- ----------------------------------------------------------------------------
-- fub_sync_history: add the columns the admin Sync History panel renders
-- (it was ported from Base44 with a different shape and showed blanks).
-- ----------------------------------------------------------------------------
alter table public.fub_sync_history
  add column if not exists status        text,
  add column if not exists contact_email text,
  add column if not exists contact_name  text,
  add column if not exists triggered_by  text,
  add column if not exists error_message text,
  add column if not exists synced_fields jsonb;

-- ----------------------------------------------------------------------------
-- Cron: drain the webhook inbox every minute (same auth pattern as the
-- process-fub-events job).
-- ----------------------------------------------------------------------------
select cron.unschedule('process-fub-webhooks')
 where exists (select 1 from cron.job where jobname = 'process-fub-webhooks');

select cron.schedule(
  'process-fub-webhooks',
  '* * * * *',
  $cron$
  select net.http_post(
    url := 'https://bfnudxyxgjhdqwlcqyar.supabase.co/functions/v1/processFubWebhooks',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', concat('Bearer ', (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key' limit 1))
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 55000
  );
  $cron$
);
