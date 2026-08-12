create table if not exists public.device_config (
  id integer primary key,
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.device_config add column if not exists config jsonb not null default '{}'::jsonb;
alter table public.device_config add column if not exists updated_at timestamptz not null default now();
insert into public.device_config (id, config) values (1, '{}'::jsonb) on conflict (id) do nothing;
