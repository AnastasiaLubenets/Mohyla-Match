alter table public.admin_actions
  drop constraint if exists admin_actions_admin_user_id_fkey;

alter table public.admin_actions
  alter column admin_user_id drop not null;

alter table public.admin_actions
  add constraint admin_actions_admin_user_id_fkey
  foreign key (admin_user_id)
  references auth.users(id)
  on delete set null;

alter table public.admin_actions
  drop constraint if exists admin_actions_report_id_fkey;

alter table public.admin_actions
  add constraint admin_actions_report_id_fkey
  foreign key (report_id)
  references public.reports(id)
  on delete set null
  deferrable initially deferred;

alter table public.product_events
  drop constraint if exists product_events_match_id_fkey;

alter table public.product_events
  add constraint product_events_match_id_fkey
  foreign key (match_id)
  references public.matches(id)
  on delete set null
  deferrable initially deferred;

drop function if exists public.delete_my_profile();
