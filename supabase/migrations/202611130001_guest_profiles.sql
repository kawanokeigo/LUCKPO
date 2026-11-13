create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  base_handle text;
  profile_name text;
begin
  if new.is_anonymous then
    base_handle := 'guest_' || substring(replace(new.id::text, '-', '') from 1 for 12);
    profile_name := 'ゲスト';
  else
    base_handle := 'user_' || substring(replace(new.id::text, '-', '') from 1 for 12);
    profile_name := coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      'ユーザー'
    );
  end if;

  insert into public.profiles (id, handle, display_name, avatar_url, is_onboarded)
  values (
    new.id,
    base_handle,
    profile_name,
    nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
    new.is_anonymous
  )
  on conflict (id) do nothing;

  return new;
end;
$$;
