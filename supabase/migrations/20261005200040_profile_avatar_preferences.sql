begin;

do $$
begin
  create type public.profile_avatar_mode as enum ('default', 'program', 'custom');
exception
  when duplicate_object then null;
end;
$$;

alter table public.profiles
  add column if not exists avatar_mode public.profile_avatar_mode not null default 'program'::public.profile_avatar_mode,
  add column if not exists custom_avatar_key text;

alter table public.profiles
  drop constraint if exists profiles_custom_avatar_key_length,
  drop constraint if exists profiles_custom_avatar_key_allowed,
  drop constraint if exists profiles_avatar_mode_custom_key;

alter table public.profiles
  add constraint profiles_custom_avatar_key_length
    check (
      custom_avatar_key is null
      or char_length(custom_avatar_key) between 8 and 80
    ),
  add constraint profiles_custom_avatar_key_allowed
    check (
      custom_avatar_key is null
      or custom_avatar_key in (
        'avatar-01',
        'avatar-02',
        'avatar-03',
        'avatar-04',
        'avatar-05',
        'avatar-06',
        'avatar-07',
        'avatar-08',
        'avatar-09',
        'avatar-10',
        'avatar-11',
        'avatar-12',
        'avatar-13',
        'avatar-14',
        'avatar-15',
        'avatar-16',
        'avatar-17',
        'avatar-18',
        'avatar-19',
        'avatar-20',
        'avatar-beanie',
        'avatar-buzz-cut',
        'avatar-dark-skin-long-curls',
        'avatar-dark-skin-short-curls',
        'avatar-freckles',
        'avatar-girl-glasses',
        'avatar-light-stubble',
        'avatar-long-black-hair',
        'avatar-longer-hair-guy',
        'avatar-pixie-cut'
      )
    ),
  add constraint profiles_avatar_mode_custom_key
    check (
      (avatar_mode = 'custom'::public.profile_avatar_mode and custom_avatar_key is not null)
      or (avatar_mode <> 'custom'::public.profile_avatar_mode and custom_avatar_key is null)
    );

grant update (avatar_mode, custom_avatar_key, updated_at)
  on public.profiles to authenticated;

comment on type public.profile_avatar_mode is
  'Profile avatar selection mode: default generated avatar, academic program avatar, or a selected Mohyla Match avatar.';
comment on column public.profiles.avatar_mode is
  'Controls how Mohyla Match resolves a profile avatar. Existing profiles default to program mode to preserve current behavior.';
comment on column public.profiles.custom_avatar_key is
  'Stable key for a supplied selectable avatar when avatar_mode is custom. Arbitrary URLs are not stored.';

commit;
