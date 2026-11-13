-- First check which generated guest accounts will be removed.
select users.id, profiles.handle, profiles.display_name
from auth.users as users
join public.profiles as profiles on profiles.id = users.id
where users.is_anonymous is true
  and profiles.handle ~ '^chance_note_[a-z0-9]{6}_[0-9]{2}$'
  and profiles.display_name ~ '^確率メモ[0-9]{2}$'
order by profiles.handle;

-- Remove only accounts created by the earlier seed script.
-- Profile posts, likes, follows, and notifications cascade from the account deletion.
delete from auth.users as users
using public.profiles as profiles
where profiles.id = users.id
  and users.is_anonymous is true
  and profiles.handle ~ '^chance_note_[a-z0-9]{6}_[0-9]{2}$'
  and profiles.display_name ~ '^確率メモ[0-9]{2}$'
returning users.id;
