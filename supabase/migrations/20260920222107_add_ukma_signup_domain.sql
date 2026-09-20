insert into public.signup_email_domains (domain, is_active)
values ('ukma.edu.ua', true)
on conflict (domain)
do update set is_active = true, updated_at = now();
