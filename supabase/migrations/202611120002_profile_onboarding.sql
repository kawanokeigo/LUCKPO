alter table public.profiles
  add column if not exists is_onboarded boolean not null default false;

alter table public.profiles
  alter column bio set default '';

grant select, update on public.profiles to authenticated;
