-- Add foreign key constraint to link events with user_preferences
-- This allows us to easily fetch user preferences when querying events

alter table events
add constraint events_created_by_fkey
foreign key (created_by)
references auth.users(id)
on delete cascade;

-- Create a view to easily get events with user preferences
create or replace view events_with_preferences as
select 
  e.*,
  up.discord_webhook_url,
  up.discord_user_id,
  up.google_calendar_enabled,
  up.notification_lead_time
from events e
left join user_preferences up on e.created_by = up.user_id;

-- Grant access to the view
grant select on events_with_preferences to authenticated;
