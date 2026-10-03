begin;

create table public.profile_social_links (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  platform text not null,
  url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_social_links_user_platform_unique unique (user_id, platform),
  constraint profile_social_links_platform_check check (
    platform in (
      'behance',
      'discord',
      'dribbble',
      'facebook',
      'github',
      'google-scholar',
      'instagram',
      'linkedin',
      'medium',
      'orcid',
      'personal-website',
      'researchgate',
      'telegram',
      'threads',
      'tiktok',
      'twitter',
      'youtube'
    )
  ),
  constraint profile_social_links_url_length check (char_length(url) between 8 and 2048),
  constraint profile_social_links_url_protocol check (url ~* '^https?://[^[:space:]]+$'),
  constraint profile_social_links_url_safe_protocol check (url !~* '^[[:space:]]*(javascript|data|vbscript):')
);

create index profile_social_links_user_order_idx
  on public.profile_social_links (user_id, sort_order, platform);

create trigger profile_social_links_set_updated_at
  before update on public.profile_social_links
  for each row execute function private.set_updated_at();

alter table public.profile_social_links enable row level security;

grant select, insert, update, delete on public.profile_social_links
  to authenticated;

create policy profile_social_links_select_visible_profile
  on public.profile_social_links
  for select to authenticated
  using (private.can_view_profile(user_id) or private.is_admin(auth.uid()));

create policy profile_social_links_insert_own_active
  on public.profile_social_links
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and private.is_active_profile(user_id)
  );

create policy profile_social_links_update_own_active
  on public.profile_social_links
  for update to authenticated
  using (user_id = auth.uid() and private.is_active_profile(user_id))
  with check (
    user_id = auth.uid()
    and private.is_active_profile(user_id)
  );

create policy profile_social_links_delete_own
  on public.profile_social_links
  for delete to authenticated
  using (user_id = auth.uid());

comment on table public.profile_social_links is
  'Optional structured profile-level social links. Links are owned by the profile user and visible only when the profile itself is visible.';
comment on column public.profile_social_links.platform is
  'Curated social/contact platform key used by the app for labels, icons, and provider hostname validation.';
comment on column public.profile_social_links.url is
  'Normalized http/https URL. Application validation enforces known provider hostnames for curated platforms.';

commit;
