-- Schedule cron job to auto-release escrow every hour
SELECT cron.schedule(
  'auto-release-design-escrow',
  '0 * * * *', -- Every hour at minute 0
  'SELECT public.auto_release_design_escrow()'
);