-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Events table
create table if not exists public.events (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  location text,
  created_by uuid references auth.users(id) on delete cascade not null,
  discord_channel_id text,
  google_calendar_event_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Notifications table
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references public.events(id) on delete cascade not null,
  notification_type text not null check (notification_type in ('discord', 'email', 'calendar')),
  scheduled_time timestamptz not null,
  sent boolean default false,
  sent_at timestamptz,
  error_message text,
  created_at timestamptz default now()
);

-- User preferences table
create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  discord_user_id text,
  discord_webhook_url text,
  google_calendar_enabled boolean default false,
  google_refresh_token text,
  notification_lead_time interval default '15 minutes',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.events enable row level security;
alter table public.notifications enable row level security;
alter table public.user_preferences enable row level security;

-- RLS Policies for events
create policy "Users can view their own events"
  on public.events for select
  using (auth.uid() = created_by);

create policy "Users can create their own events"
  on public.events for insert
  with check (auth.uid() = created_by);

create policy "Users can update their own events"
  on public.events for update
  using (auth.uid() = created_by);

create policy "Users can delete their own events"
  on public.events for delete
  using (auth.uid() = created_by);

-- RLS Policies for notifications
create policy "Users can view notifications for their events"
  on public.notifications for select
  using (
    exists (
      select 1 from public.events
      where events.id = notifications.event_id
      and events.created_by = auth.uid()
    )
  );

create policy "Users can create notifications for their events"
  on public.notifications for insert
  with check (
    exists (
      select 1 from public.events
      where events.id = notifications.event_id
      and events.created_by = auth.uid()
    )
  );

create policy "Users can update notifications for their events"
  on public.notifications for update
  using (
    exists (
      select 1 from public.events
      where events.id = notifications.event_id
      and events.created_by = auth.uid()
    )
  );

create policy "Users can delete notifications for their events"
  on public.notifications for delete
  using (
    exists (
      select 1 from public.events
      where events.id = notifications.event_id
      and events.created_by = auth.uid()
    )
  );

-- RLS Policies for user_preferences
create policy "Users can view their own preferences"
  on public.user_preferences for select
  using (auth.uid() = user_id);

create policy "Users can insert their own preferences"
  on public.user_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own preferences"
  on public.user_preferences for update
  using (auth.uid() = user_id);

create policy "Users can delete their own preferences"
  on public.user_preferences for delete
  using (auth.uid() = user_id);

-- Create indexes for better performance
create index if not exists events_created_by_idx on public.events(created_by);
create index if not exists events_start_time_idx on public.events(start_time);
create index if not exists notifications_event_id_idx on public.notifications(event_id);
create index if not exists notifications_scheduled_time_idx on public.notifications(scheduled_time);
create index if not exists notifications_sent_idx on public.notifications(sent);

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Triggers for updated_at
create trigger events_updated_at
  before update on public.events
  for each row
  execute function public.handle_updated_at();

create trigger user_preferences_updated_at
  before update on public.user_preferences
  for each row
  execute function public.handle_updated_at();
