create table if not exists public.device_config (
  id integer primary key,
  image_base64 text,
  schedule jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.device_config (id, image_base64, schedule)
values (1, null, '[]'::jsonb)
on conflict (id) do nothing;