create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  handle text not null unique,
  display_name text not null default 'ユーザー',
  bio text not null default '',
  avatar_url text,
  is_onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_handle_format check (handle ~ '^[a-zA-Z0-9_]{3,24}$')
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('luck', 'unluck')),
  probability text not null,
  body text not null check (char_length(body) between 1 and 2000),
  image_path text,
  created_at timestamptz not null default now()
);

create table public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_no_self_follow check (follower_id <> following_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid not null references public.profiles (id) on delete cascade,
  post_id uuid references public.posts (id) on delete cascade,
  kind text not null check (kind in ('like', 'follow')),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint notifications_not_self check (recipient_id <> actor_id)
);

create index posts_created_at_idx on public.posts (created_at desc);
create index posts_user_created_at_idx on public.posts (user_id, created_at desc);
create index post_likes_user_idx on public.post_likes (user_id, created_at desc);
create index follows_following_idx on public.follows (following_id);
create index notifications_recipient_created_idx on public.notifications (recipient_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  base_handle text;
begin
  base_handle := 'user_' || substring(replace(new.id::text, '-', '') from 1 for 12);
  insert into public.profiles (id, handle, display_name, avatar_url)
  values (
    new.id,
    base_handle,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), nullif(new.raw_user_meta_data ->> 'name', ''), 'ユーザー'),
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.create_profile_for_new_user();

create or replace function public.create_like_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  post_owner uuid;
begin
  select user_id into post_owner from public.posts where id = new.post_id;
  if post_owner is not null and post_owner <> new.user_id then
    insert into public.notifications (recipient_id, actor_id, post_id, kind)
    values (post_owner, new.user_id, new.post_id, 'like');
  end if;
  return new;
end;
$$;

create trigger on_post_liked
after insert on public.post_likes
for each row execute function public.create_like_notification();

create or replace function public.create_follow_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (recipient_id, actor_id, kind)
  values (new.following_id, new.follower_id, 'follow');
  return new;
end;
$$;

create trigger on_user_followed
after insert on public.follows
for each row execute function public.create_follow_notification();

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.follows enable row level security;
alter table public.notifications enable row level security;

create policy "profiles are visible to everyone"
on public.profiles for select to anon, authenticated using (true);
create policy "users create their own profile"
on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "users update their own profile"
on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "posts are visible to everyone"
on public.posts for select to anon, authenticated using (true);
create policy "signed in users create their own posts"
on public.posts for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "users update their own posts"
on public.posts for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "users delete their own posts"
on public.posts for delete to authenticated using ((select auth.uid()) = user_id);

create policy "likes are visible to everyone"
on public.post_likes for select to anon, authenticated using (true);
create policy "users like as themselves"
on public.post_likes for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "users remove their own likes"
on public.post_likes for delete to authenticated using ((select auth.uid()) = user_id);

create policy "follows are visible to everyone"
on public.follows for select to anon, authenticated using (true);
create policy "users follow as themselves"
on public.follows for insert to authenticated with check ((select auth.uid()) = follower_id);
create policy "users unfollow as themselves"
on public.follows for delete to authenticated using ((select auth.uid()) = follower_id);

create policy "users read their notifications"
on public.notifications for select to authenticated using ((select auth.uid()) = recipient_id);
create policy "users mark their notifications read"
on public.notifications for update to authenticated using ((select auth.uid()) = recipient_id) with check ((select auth.uid()) = recipient_id);
create policy "users delete their notifications"
on public.notifications for delete to authenticated using ((select auth.uid()) = recipient_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-images', 'post-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

create policy "post images are publicly readable"
on storage.objects for select to anon, authenticated using (bucket_id = 'post-images');
create policy "users upload images into their own folder"
on storage.objects for insert to authenticated
with check (bucket_id = 'post-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "users update images in their own folder"
on storage.objects for update to authenticated
using (bucket_id = 'post-images' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'post-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "users delete images in their own folder"
on storage.objects for delete to authenticated
using (bucket_id = 'post-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

grant select on public.profiles, public.posts, public.post_likes, public.follows to anon, authenticated;
grant insert, update on public.profiles to authenticated;
grant insert, update, delete on public.posts to authenticated;
grant insert, delete on public.post_likes, public.follows to authenticated;
grant select, update, delete on public.notifications to authenticated;
