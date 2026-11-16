-- Keep the every-minute full listing refresh out of the minutes when
-- spark-sync-internal (*/15) runs. Running both at once caused statement
-- timeouts in the internal sync's upserts.
select cron.alter_job(
  job_id := (select jobid from cron.job where jobname = 'spark-sync-full-refresh'),
  schedule := '1-13,16-28,31-43,46-58 * * * *'
);
