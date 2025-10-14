-- Enable pg_cron extension
create extension if not exists pg_cron;

-- Schedule the check-upcoming-events function to run every 5 minutes
select cron.schedule(
  'check-upcoming-events',
  '*/5 * * * *', -- Every 5 minutes
  $$
  select
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/check-upcoming-events',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key')
      )
    ) as request_id;
  $$
);

-- View scheduled jobs
select * from cron.job;
