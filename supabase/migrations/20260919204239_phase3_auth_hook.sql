create or replace function public.hook_before_user_created(event jsonb)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  normalized_email text;
  email_domain text;
  is_allowed boolean;
begin
  normalized_email := lower(trim(coalesce(event -> 'user' ->> 'email', '')));

  if normalized_email = ''
    or normalized_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  then
    return jsonb_build_object(
      'error',
      jsonb_build_object(
        'http_code',
        400,
        'message',
        'Signup requires a valid corporate email address.'
      )
    );
  end if;

  email_domain := split_part(normalized_email, '@', 2);

  if email_domain = ''
    or email_domain !~ '^[a-z0-9.-]+$'
  then
    return jsonb_build_object(
      'error',
      jsonb_build_object(
        'http_code',
        400,
        'message',
        'Signup requires a valid corporate email address.'
      )
    );
  end if;

  select exists (
    select 1
    from public.signup_email_domains
    where domain = email_domain
      and is_active
  )
  into is_allowed;

  if is_allowed then
    return '{}'::jsonb;
  end if;

  return jsonb_build_object(
    'error',
    jsonb_build_object(
      'http_code',
      403,
      'message',
      'Signup is limited to verified corporate email domains.'
    )
  );
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant select on public.signup_email_domains to supabase_auth_admin;

revoke execute on function public.hook_before_user_created(jsonb) from public, anon, authenticated;
grant execute on function public.hook_before_user_created(jsonb) to supabase_auth_admin;

create policy signup_email_domains_select_auth_hook
  on public.signup_email_domains
  for select
  to supabase_auth_admin
  using (is_active);
