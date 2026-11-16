-- Schedule syncMembersOffices: replicate Spark Member + Office and refresh the
-- agent/office details shown on listings. Every 30 min at :07 and :37 so it
-- doesn't land on the same minute as the 10-min listing sync.
-- verify_jwt is off for this function (same as syncListingsReso), so no
-- Authorization header is needed.
DO $cron$ BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'spark-sync-members-offices') THEN
    PERFORM cron.unschedule('spark-sync-members-offices');
  END IF;
  PERFORM cron.schedule(
    'spark-sync-members-offices',
    '7,37 * * * *',
    $cmd$
      SELECT net.http_post(
        url := 'https://bfnudxyxgjhdqwlcqyar.supabase.co/functions/v1/syncMembersOffices',
        headers := jsonb_build_object('Content-Type', 'application/json'),
        body := '{}'::jsonb,
        timeout_milliseconds := 60000
      );
    $cmd$
  );
END $cron$;
