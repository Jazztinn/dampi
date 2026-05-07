alter table public.profiles
  add column if not exists email text;

update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id
  and p.email is null;

create index if not exists profiles_email_lower_idx
  on public.profiles (lower(email));

create or replace function public.search_care_circle_profiles(
  p_query text,
  p_limit integer default 12
)
returns table(
  id uuid,
  full_name text,
  avatar_url text
)
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  q text := lower(trim(coalesce(p_query, '')));
  digits text := regexp_replace(coalesce(p_query, ''), '[^0-9]', '', 'g');
  max_rows integer := least(greatest(coalesce(p_limit, 12), 1), 25);
begin
  if auth.uid() is null or q = '' then
    return;
  end if;

  return query
  select p.id, p.full_name, p.avatar_url
  from public.profiles p
  where p.discoverable = true
    and public.care_circle_profile_is_available(p.id)
    and (
      (length(q) >= 2 and lower(p.full_name) like '%' || q || '%')
      or (position('@' in q) > 0 and lower(coalesce(p.email, '')) = q)
      or (length(digits) >= 7 and regexp_replace(p.phone, '[^0-9]', '', 'g') = digits)
    )
  order by
    case when lower(p.full_name) = q then 0 else 1 end,
    p.full_name asc
  limit max_rows;
end;
$$;

grant execute on function public.search_care_circle_profiles(text, integer) to authenticated;
