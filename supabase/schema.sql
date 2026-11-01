-- JM Lead Dashboard — Supabase schema
-- Supabase dashboard > SQL Editor me ye poora paste karke "Run" dabayein.

create table if not exists public.leads (
  user_id    uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  id         text        not null,
  data       jsonb       not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.app_settings (
  user_id    uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  key        text        not null,
  value      jsonb       not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

-- Har user sirf apna data dekh / badal sakta hai
alter table public.leads        enable row level security;
alter table public.app_settings enable row level security;

drop policy if exists "own leads" on public.leads;
create policy "own leads" on public.leads
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own settings" on public.app_settings;
create policy "own settings" on public.app_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
