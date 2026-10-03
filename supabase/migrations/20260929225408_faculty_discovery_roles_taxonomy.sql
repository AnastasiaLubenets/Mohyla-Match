begin;

do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'account_role'
  ) then
    create type public.account_role as enum ('student', 'faculty');
  end if;

  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'faculty_verification_status'
  ) then
    create type public.faculty_verification_status as enum ('unverified', 'verified');
  end if;

  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'academic_program_level'
  ) then
    create type public.academic_program_level as enum ('bachelor', 'master');
  end if;
end $$;

alter table public.academic_programs
  add column if not exists study_level public.academic_program_level not null default 'bachelor',
  add column if not exists specialty_code text,
  add column if not exists official_source_url text;

alter table public.academic_programs
  drop constraint if exists academic_programs_specialty_code_length,
  add constraint academic_programs_specialty_code_length
    check (specialty_code is null or char_length(specialty_code) between 1 and 40),
  drop constraint if exists academic_programs_official_source_url_length,
  add constraint academic_programs_official_source_url_length
    check (official_source_url is null or char_length(official_source_url) between 10 and 400);

alter table public.profiles
  add column if not exists account_role public.account_role not null default 'student',
  add column if not exists faculty_verification_status public.faculty_verification_status not null default 'unverified';

alter table public.profiles
  alter column year_of_study drop not null,
  drop constraint if exists profiles_year_of_study_range,
  drop constraint if exists profiles_year_required_by_role,
  add constraint profiles_year_required_by_role check (
    (
      account_role = 'student'::public.account_role
      and year_of_study between 1 and 6
    )
    or (
      account_role = 'faculty'::public.account_role
      and year_of_study is null
    )
  );

create table if not exists public.account_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  account_role public.account_role not null default 'student',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profile_academic_programs (
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  academic_program_id bigint not null references public.academic_programs(id) on delete restrict,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (user_id, academic_program_id)
);

create unique index if not exists profile_academic_programs_one_primary_idx
  on public.profile_academic_programs (user_id)
  where is_primary;

create table if not exists public.expertise_categories (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint expertise_categories_slug_format
    check (slug = lower(slug) and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint expertise_categories_name_length
    check (char_length(name) between 2 and 120)
);

create table if not exists public.expertise (
  id bigint generated always as identity primary key,
  category_id bigint not null references public.expertise_categories(id) on delete restrict,
  slug text not null unique,
  name text not null,
  search_aliases text[] not null default '{}'::text[],
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint expertise_category_name_unique unique (category_id, name),
  constraint expertise_slug_format
    check (slug = lower(slug) and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint expertise_name_length
    check (char_length(name) between 2 and 120)
);

create table if not exists public.academic_program_expertise (
  academic_program_id bigint not null references public.academic_programs(id) on delete cascade,
  expertise_id bigint not null references public.expertise(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (academic_program_id, expertise_id)
);

create table if not exists public.faculty_expertise (
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  expertise_id bigint not null references public.expertise(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (user_id, expertise_id)
);

create trigger account_roles_set_updated_at
  before update on public.account_roles
  for each row execute function private.set_updated_at();

create trigger expertise_categories_set_updated_at
  before update on public.expertise_categories
  for each row execute function private.set_updated_at();

create trigger expertise_set_updated_at
  before update on public.expertise
  for each row execute function private.set_updated_at();

insert into public.account_roles (user_id, account_role)
select p.user_id, p.account_role
from public.profiles p
on conflict (user_id) do update
set account_role = excluded.account_role,
    updated_at = now();

insert into public.profile_academic_programs (user_id, academic_program_id, is_primary)
select p.user_id, p.academic_program_id, true
from public.profiles p
on conflict (user_id, academic_program_id) do update
set is_primary = true;

create or replace function private.get_account_role(check_user_id uuid)
returns public.account_role
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select p.account_role
      from public.profiles p
      where p.user_id = check_user_id
    ),
    (
      select ar.account_role
      from public.account_roles ar
      where ar.user_id = check_user_id
    ),
    'student'::public.account_role
  );
$$;

create or replace function private.is_active_onboarded_student(check_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    exists (
      select 1
      from public.profiles p
      where p.user_id = check_user_id
        and p.account_role = 'student'::public.account_role
        and p.profile_status = 'active'::public.profile_status
        and p.deleted_at is null
        and p.onboarding_completed_at is not null
    ),
    false
  );
$$;

create or replace function private.prevent_profile_self_verification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.faculty_verification_status <> 'unverified'::public.faculty_verification_status
      and not private.is_admin(auth.uid())
    then
      raise exception 'Faculty verification can only be changed by an administrator.'
        using errcode = '42501';
    end if;

    new.account_role := coalesce(
      (
        select ar.account_role
        from public.account_roles ar
        where ar.user_id = new.user_id
      ),
      new.account_role,
      'student'::public.account_role
    );

    if new.account_role = 'student'::public.account_role
      and new.faculty_verification_status <> 'unverified'::public.faculty_verification_status
    then
      new.faculty_verification_status := 'unverified'::public.faculty_verification_status;
    end if;

    return new;
  end if;

  if old.account_role <> new.account_role
    and old.onboarding_completed_at is not null
    and not private.is_admin(auth.uid())
  then
    raise exception 'Completed account roles cannot be changed.'
      using errcode = '42501';
  end if;

  if old.faculty_verification_status <> new.faculty_verification_status
    and not private.is_admin(auth.uid())
  then
    raise exception 'Faculty verification can only be changed by an administrator.'
      using errcode = '42501';
  end if;

  if new.account_role = 'student'::public.account_role
    and new.faculty_verification_status <> 'unverified'::public.faculty_verification_status
  then
    new.faculty_verification_status := 'unverified'::public.faculty_verification_status;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_prevent_profile_self_verification on public.profiles;
create trigger profiles_prevent_profile_self_verification
  before insert or update on public.profiles
  for each row execute function private.prevent_profile_self_verification();

create temp table official_faculties (
  slug text primary key,
  display_name text not null,
  avatar_theme_key text not null,
  sort_order integer not null
) on commit drop;

insert into official_faculties (slug, display_name, avatar_theme_key, sort_order)
values
  ('kma-school-professional-continuing-education', 'Києво-Могилянська школа професійної та неперервної освіти', 'faculty-continuing-education', 5),
  ('faculty-economics', 'Факультет економічних наук', 'faculty-economics', 10),
  ('faculty-social-sciences-social-technologies', 'Факультет соціальних наук та соціальних технологій', 'faculty-social-sciences', 20),
  ('faculty-law', 'Факультет правничих наук', 'faculty-law', 30),
  ('faculty-humanities', 'Факультет гуманітарних наук', 'faculty-humanities', 40),
  ('faculty-international-relations-governance', 'Факультет міжнародних відносин та врядування', 'faculty-ir-governance', 50),
  ('faculty-natural-sciences', 'Факультет природничих наук', 'faculty-natural-sciences', 60),
  ('faculty-informatics', 'Факультет інформатики', 'faculty-informatics', 70),
  ('faculty-health-social-work-psychology', 'Факультет охорони здоров’я, соціальної роботи і психології', 'faculty-health-social-work-psychology', 80),
  ('liberal-arts-studies-center', 'Центр «Liberal Arts Studies»', 'faculty-liberal-arts', 90);

insert into public.faculties (slug, display_name, avatar_theme_key, sort_order, is_active)
select slug, display_name, avatar_theme_key, sort_order, true
from official_faculties
on conflict (slug) do update
set display_name = excluded.display_name,
    avatar_theme_key = excluded.avatar_theme_key,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

create temp table official_programs (
  faculty_slug text not null,
  slug text primary key,
  display_name text not null,
  avatar_variant_key text not null,
  study_level public.academic_program_level not null,
  specialty_code text not null,
  official_source_url text not null,
  sort_order integer not null
) on commit drop;

insert into official_programs (
  faculty_slug,
  slug,
  display_name,
  avatar_variant_key,
  study_level,
  specialty_code,
  official_source_url,
  sort_order
)
values
  ('kma-school-professional-continuing-education', 'political-leadership-economic-diplomacy', 'Політичне лідерство та економічна дипломатія', 'program-political-science', 'bachelor', 'С1+С2', 'https://vstup.ukma.edu.ua/education-programs?level=BACHELOR', 5),
  ('faculty-humanities', 'history', 'Історія', 'program-history', 'bachelor', 'В9', 'https://vstup.ukma.edu.ua/education-programs?level=BACHELOR', 110),
  ('faculty-humanities', 'archaeology', 'Археологія', 'program-archaeology', 'bachelor', 'В9', 'https://vstup.ukma.edu.ua/education-programs?level=BACHELOR', 120),
  ('faculty-humanities', 'philosophy', 'Філософія', 'program-philosophy', 'bachelor', 'В10', 'https://vstup.ukma.edu.ua/education-programs?level=BACHELOR', 130),
  ('faculty-humanities', 'english-and-ukrainian-language', 'Англійська мова та українська мова', 'program-english-and-ukrainian-language', 'bachelor', 'В11', 'https://vstup.ukma.edu.ua/education-programs?level=BACHELOR', 140),
  ('faculty-humanities', 'language-literature-comparative-studies', 'Мова, література, компаративістика', 'program-language-literature-comparative-studies', 'bachelor', 'В11', 'https://vstup.ukma.edu.ua/education-programs?level=BACHELOR', 150),
  ('faculty-humanities', 'cultural-studies', 'Культурологія', 'program-cultural-studies', 'bachelor', 'В12', 'https://vstup.ukma.edu.ua/education-programs?level=BACHELOR', 160),
  ('faculty-economics', 'economics', 'Економіка', 'program-economics', 'bachelor', 'С1.01', 'https://vstup.ukma.edu.ua/education-programs?level=BACHELOR', 210),
  ('faculty-economics', 'finance-banking-insurance', 'Фінанси, банківська справа та страхування', 'program-finance-banking-insurance', 'bachelor', 'D2', 'https://vstup.ukma.edu.ua/education-programs?level=BACHELOR', 220),
  ('faculty-economics', 'management', 'Менеджмент', 'program-management', 'bachelor', 'D3', 'https://vstup.ukma.edu.ua/education-programs?level=BACHELOR', 230),
  ('faculty-economics', 'marketing', 'Маркетинг', 'program-marketing', 'bachelor', 'D5', 'https://vstup.ukma.edu.ua/education-programs?level=BACHELOR', 240),
  ('faculty-international-relations-governance', 'international-relations-public-communications-regional-studies', 'Міжнародні відносини, суспільні комунікації та регіональні студії', 'program-international-relations-public-communications-regional-studies', 'bachelor', 'С3', 'https://vstup.ukma.edu.ua/education-programs?level=BACHELOR', 310),
  ('faculty-international-relations-governance', 'public-private-governance', 'Суспільне і приватне врядування', 'program-public-private-governance', 'bachelor', 'D4', 'https://vstup.ukma.edu.ua/education-programs?level=BACHELOR', 320),
  ('faculty-health-social-work-psychology', 'psychology', 'Психологія', 'program-psychology', 'bachelor', 'С4', 'https://vstup.ukma.edu.ua/education-programs?level=BACHELOR', 410),
  ('faculty-health-social-work-psychology', 'social-work', 'Соціальна робота', 'program-social-work', 'bachelor', 'І10', 'https://vstup.ukma.edu.ua/education-programs?level=BACHELOR', 420),
  ('faculty-health-social-work-psychology', 'medicine', 'Магістерська ОПП «Медицина»', 'program-medicine', 'bachelor', 'І2', 'https://vstup.ukma.edu.ua/education-programs?level=BACHELOR', 430),
  ('faculty-law', 'law', 'Право', 'program-law', 'bachelor', 'D8', 'https://vstup.ukma.edu.ua/education-programs?level=BACHELOR', 510),
  ('faculty-natural-sciences', 'biology-biotechnology', 'Біологія та біотехнологія', 'program-biology-biotechnology', 'bachelor', 'Е1', 'https://vstup.ukma.edu.ua/education-programs?level=BACHELOR', 610),
  ('faculty-natural-sciences', 'ecology', 'Екологія', 'program-ecology', 'bachelor', 'E2', 'https://vstup.ukma.edu.ua/education-programs?level=BACHELOR', 620),
  ('faculty-natural-sciences', 'chemistry', 'Хімія', 'program-chemistry', 'bachelor', 'E3', 'https://vstup.ukma.edu.ua/education-programs?level=BACHELOR', 630),
  ('faculty-natural-sciences', 'rocket-aerospace-systems-physics', 'Фізика ракетних і аерокосмічних систем', 'program-rocket-aerospace-systems-physics', 'bachelor', 'Е5', 'https://vstup.ukma.edu.ua/education-programs?level=BACHELOR', 640),
  ('faculty-social-sciences-social-technologies', 'political-science', 'Політологія', 'program-political-science', 'bachelor', 'С2', 'https://vstup.ukma.edu.ua/education-programs?level=BACHELOR', 710),
  ('faculty-social-sciences-social-technologies', 'sociology', 'Соціологія', 'program-sociology', 'bachelor', 'С5', 'https://vstup.ukma.edu.ua/education-programs?level=BACHELOR', 720),
  ('faculty-social-sciences-social-technologies', 'public-relations', 'Зв’язки з громадськістю', 'program-public-relations', 'bachelor', 'С7', 'https://vstup.ukma.edu.ua/education-programs?level=BACHELOR', 730),
  ('faculty-informatics', 'applied-mathematics', 'Прикладна математика', 'program-applied-mathematics', 'bachelor', 'F1', 'https://vstup.ukma.edu.ua/education-programs?level=BACHELOR', 810),
  ('faculty-informatics', 'big-data-analytics', 'Аналітика великих даних', 'program-big-data-analytics', 'bachelor', 'F1', 'https://vstup.ukma.edu.ua/education-programs?level=BACHELOR', 820),
  ('faculty-informatics', 'software-engineering', 'Інженерія програмного забезпечення', 'program-software-engineering', 'bachelor', 'F2', 'https://vstup.ukma.edu.ua/education-programs?level=BACHELOR', 830),
  ('faculty-informatics', 'computer-science', 'Комп’ютерні науки', 'program-computer-science', 'bachelor', 'F3', 'https://vstup.ukma.edu.ua/education-programs?level=BACHELOR', 840),
  ('faculty-informatics', 'information-systems-vulnerability-analysis', 'Аналіз вразливостей інформаційних систем', 'program-information-systems-vulnerability-analysis', 'bachelor', 'F5', 'https://vstup.ukma.edu.ua/education-programs?level=BACHELOR', 850),
  ('faculty-informatics', 'automation-computer-integrated-technologies-robotics', 'Автоматизація, комп’ютерно-інтегровані технології та робототехніка', 'program-automation-computer-integrated-technologies-robotics', 'bachelor', 'G7', 'https://vstup.ukma.edu.ua/education-programs?level=BACHELOR', 860),
  ('liberal-arts-studies-center', 'mohyla-trivium-liberal-arts-sciences', 'Могилянський тривіум: Liberal Arts and Sciences', 'program-liberal-arts', 'bachelor', 'LAS', 'https://vstup.ukma.edu.ua/education-programs?level=BACHELOR', 910),
  ('kma-school-professional-continuing-education', 'master-economic-diplomacy-gr-policies', 'Економічна дипломатія і GR-політики', 'program-political-science', 'master', 'С1+С2', 'https://vstup.ukma.edu.ua/education-programs?level=MASTER', 1005),
  ('kma-school-professional-continuing-education', 'master-city-governance-policy', 'Політика врядування в місті', 'program-management', 'master', 'С2+D3', 'https://vstup.ukma.edu.ua/education-programs?level=MASTER', 1010),
  ('kma-school-professional-continuing-education', 'master-education-management', 'Управління освітою', 'program-management', 'master', 'D3', 'https://vstup.ukma.edu.ua/education-programs?level=MASTER', 1015),
  ('faculty-humanities', 'master-judaic-studies', 'Юдаїка', 'program-cultural-studies', 'master', 'В9', 'https://vstup.ukma.edu.ua/education-programs?level=MASTER', 1110),
  ('faculty-humanities', 'master-history', 'Історія', 'program-history', 'master', 'В9', 'https://vstup.ukma.edu.ua/education-programs?level=MASTER', 1120),
  ('faculty-humanities', 'master-archaeology', 'Археологія', 'program-archaeology', 'master', 'В9', 'https://vstup.ukma.edu.ua/education-programs?level=MASTER', 1130),
  ('faculty-humanities', 'master-philosophy', 'Філософія', 'program-philosophy', 'master', 'В10', 'https://vstup.ukma.edu.ua/education-programs?level=MASTER', 1140),
  ('faculty-humanities', 'master-ukrainian-comparative-psycholinguistics', 'Українська мова, компаративістика і психолінгвістика', 'program-language-literature-comparative-studies', 'master', 'В11', 'https://vstup.ukma.edu.ua/education-programs?level=MASTER', 1150),
  ('faculty-humanities', 'master-english-ukrainian-languages-communication', 'Мови (англійська й українська) та комунікація', 'program-english-and-ukrainian-language', 'master', 'В11', 'https://vstup.ukma.edu.ua/education-programs?level=MASTER', 1160),
  ('faculty-humanities', 'master-literary-theory-history-comparative-studies', 'Теорія, історія літератури та компаративістика', 'program-language-literature-comparative-studies', 'master', 'В11', 'https://vstup.ukma.edu.ua/education-programs?level=MASTER', 1170),
  ('faculty-humanities', 'master-mohyla-cultural-studies', 'Могилянські культурологічні студії', 'program-cultural-studies', 'master', 'В12', 'https://vstup.ukma.edu.ua/education-programs?level=MASTER', 1180),
  ('faculty-economics', 'master-economics', 'Економіка', 'program-economics', 'master', 'С1.01', 'https://vstup.ukma.edu.ua/education-programs?level=MASTER', 1210),
  ('faculty-economics', 'master-international-business', 'Міжнародний бізнес', 'program-management', 'master', 'С1.02+D3', 'https://vstup.ukma.edu.ua/education-programs?level=MASTER', 1220),
  ('faculty-economics', 'master-finance-banking-insurance', 'Фінанси, банківська справа та страхування', 'program-finance-banking-insurance', 'master', 'D2', 'https://vstup.ukma.edu.ua/education-programs?level=MASTER', 1230),
  ('faculty-economics', 'master-business-development-management-consulting', 'Розвиток бізнесу: управління та консалтинг', 'program-management', 'master', 'D3', 'https://vstup.ukma.edu.ua/education-programs?level=MASTER', 1240),
  ('faculty-economics', 'master-marketing', 'Маркетинг', 'program-marketing', 'master', 'D5', 'https://vstup.ukma.edu.ua/education-programs?level=MASTER', 1250),
  ('faculty-international-relations-governance', 'master-international-relations-public-communications-regional-studies', 'Міжнародні відносини, суспільні комунікації та регіональні студії', 'program-international-relations-public-communications-regional-studies', 'master', 'С3', 'https://vstup.ukma.edu.ua/education-programs?level=MASTER', 1310),
  ('faculty-international-relations-governance', 'master-russian-studies-international-security-challenges', 'Російські студії: виклики міжнародній безпеці', 'program-international-relations-public-communications-regional-studies', 'master', 'С3', 'https://vstup.ukma.edu.ua/education-programs?level=MASTER', 1320),
  ('faculty-international-relations-governance', 'master-public-policy-governance', 'Суспільна політика і врядування', 'program-public-private-governance', 'master', 'D4', 'https://vstup.ukma.edu.ua/education-programs?level=MASTER', 1330),
  ('faculty-health-social-work-psychology', 'master-healthcare-management', 'Менеджмент в охороні здоров''я', 'program-management', 'master', 'D3', 'https://vstup.ukma.edu.ua/education-programs?level=MASTER', 1410),
  ('faculty-health-social-work-psychology', 'master-psychology', 'Психологія', 'program-psychology', 'master', 'С4', 'https://vstup.ukma.edu.ua/education-programs?level=MASTER', 1420),
  ('faculty-health-social-work-psychology', 'master-public-health', 'Громадське здоров’я', 'program-medicine', 'master', 'І9', 'https://vstup.ukma.edu.ua/education-programs?level=MASTER', 1430),
  ('faculty-health-social-work-psychology', 'master-social-work', 'Соціальна робота', 'program-social-work', 'master', 'І10', 'https://vstup.ukma.edu.ua/education-programs?level=MASTER', 1440),
  ('faculty-law', 'master-law', 'Право', 'program-law', 'master', 'D8', 'https://vstup.ukma.edu.ua/education-programs?level=MASTER', 1510),
  ('faculty-natural-sciences', 'master-molecular-biology', 'Молекулярна біологія', 'program-biology-biotechnology', 'master', 'Е1', 'https://vstup.ukma.edu.ua/education-programs?level=MASTER', 1610),
  ('faculty-natural-sciences', 'master-ecology-environmental-protection', 'Екологія та охорона навколишнього середовища', 'program-ecology', 'master', 'E2', 'https://vstup.ukma.edu.ua/education-programs?level=MASTER', 1620),
  ('faculty-natural-sciences', 'master-chemistry', 'Хімія', 'program-chemistry', 'master', 'E3', 'https://vstup.ukma.edu.ua/education-programs?level=MASTER', 1630),
  ('faculty-natural-sciences', 'master-physics-aerodynamic-systems-modeling', 'Фізика та моделювання аеродинамічних систем', 'program-rocket-aerospace-systems-physics', 'master', 'Е5', 'https://vstup.ukma.edu.ua/education-programs?level=MASTER', 1640),
  ('faculty-social-sciences-social-technologies', 'master-anticorruption-studies', 'Антикорупційні студії', 'program-political-science', 'master', 'С2', 'https://vstup.ukma.edu.ua/education-programs?level=MASTER', 1710),
  ('faculty-social-sciences-social-technologies', 'master-political-science', 'Політологія', 'program-political-science', 'master', 'С2', 'https://vstup.ukma.edu.ua/education-programs?level=MASTER', 1720),
  ('faculty-social-sciences-social-technologies', 'master-sociology', 'Соціологія', 'program-sociology', 'master', 'С5', 'https://vstup.ukma.edu.ua/education-programs?level=MASTER', 1730),
  ('faculty-social-sciences-social-technologies', 'master-journalism', 'Журналістика', 'program-public-relations', 'master', 'С7', 'https://vstup.ukma.edu.ua/education-programs?level=MASTER', 1740),
  ('faculty-social-sciences-social-technologies', 'master-public-relations', 'Зв’язки з громадськістю', 'program-public-relations', 'master', 'С7', 'https://vstup.ukma.edu.ua/education-programs?level=MASTER', 1750),
  ('faculty-informatics', 'master-applied-mathematics', 'Прикладна математика', 'program-applied-mathematics', 'master', 'F1', 'https://vstup.ukma.edu.ua/education-programs?level=MASTER', 1810),
  ('faculty-informatics', 'master-software-engineering', 'Інженерія програмного забезпечення', 'program-software-engineering', 'master', 'F2', 'https://vstup.ukma.edu.ua/education-programs?level=MASTER', 1820),
  ('faculty-informatics', 'master-computer-science', 'Комп’ютерні науки', 'program-computer-science', 'master', 'F3', 'https://vstup.ukma.edu.ua/education-programs?level=MASTER', 1830);

insert into public.academic_programs (
  faculty_id,
  slug,
  display_name,
  avatar_variant_key,
  study_level,
  specialty_code,
  official_source_url,
  sort_order,
  is_active
)
select
  f.id,
  op.slug,
  op.display_name,
  op.avatar_variant_key,
  op.study_level,
  op.specialty_code,
  op.official_source_url,
  op.sort_order,
  true
from official_programs op
join public.faculties f on f.slug = op.faculty_slug
on conflict (slug) do update
set faculty_id = excluded.faculty_id,
    display_name = excluded.display_name,
    avatar_variant_key = excluded.avatar_variant_key,
    study_level = excluded.study_level,
    specialty_code = excluded.specialty_code,
    official_source_url = excluded.official_source_url,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

update public.academic_programs
set is_active = false,
    updated_at = now()
where slug not in (select slug from official_programs)
  and slug not like 'development-%'
  and not exists (
    select 1
    from public.profiles p
    where p.academic_program_id = academic_programs.id
  );

create temp table canonical_expertise_categories (
  slug text primary key,
  name text not null,
  sort_order integer not null
) on commit drop;

insert into canonical_expertise_categories (slug, name, sort_order)
values
  ('computer-data-systems', 'Computer, Data & Systems', 10),
  ('economics-business-management', 'Economics, Business & Management', 20),
  ('law-governance-policy', 'Law, Governance & Policy', 30),
  ('humanities-culture-languages', 'Humanities, Culture & Languages', 40),
  ('social-behavioral-sciences', 'Social & Behavioral Sciences', 50),
  ('natural-health-sciences', 'Natural & Health Sciences', 60),
  ('research-methods-teaching', 'Research Methods & Teaching', 70),
  ('media-communications-design', 'Media, Communications & Design', 80);

insert into public.expertise_categories (slug, name, sort_order, is_active)
select slug, name, sort_order, true
from canonical_expertise_categories
on conflict (slug) do update
set name = excluded.name,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

create temp table canonical_expertise (
  category_slug text not null,
  slug text primary key,
  name text not null,
  search_aliases text[] not null,
  sort_order integer not null,
  program_keywords text[] not null
) on commit drop;

insert into canonical_expertise (
  category_slug,
  slug,
  name,
  search_aliases,
  sort_order,
  program_keywords
)
values
  ('computer-data-systems', 'software-engineering', 'Software Engineering', array['programming','development'], 10, array['software','computer','інженерія програмного','комп’ютерні науки']),
  ('computer-data-systems', 'computer-science', 'Computer Science', array['algorithms','systems'], 20, array['computer','комп’ютерні науки']),
  ('computer-data-systems', 'cybersecurity', 'Cybersecurity', array['security','information security'], 30, array['вразливостей','cyber','security']),
  ('computer-data-systems', 'data-science-analytics', 'Data Science & Analytics', array['big data','analytics'], 40, array['даних','data','аналітика','statistics']),
  ('computer-data-systems', 'applied-mathematics-modeling', 'Applied Mathematics & Modeling', array['modeling','mathematics'], 50, array['математика','моделювання','physics']),
  ('computer-data-systems', 'automation-robotics', 'Automation & Robotics', array['robotics','automation'], 60, array['робототехніка','automation']),
  ('economics-business-management', 'economics', 'Economics', array['economic analysis'], 110, array['економіка','economic']),
  ('economics-business-management', 'finance-banking-insurance', 'Finance, Banking & Insurance', array['finance','banking'], 120, array['фінанси','banking','insurance']),
  ('economics-business-management', 'marketing', 'Marketing', array['market research','brand'], 130, array['маркетинг','marketing']),
  ('economics-business-management', 'management-consulting', 'Management & Consulting', array['management','consulting'], 140, array['менеджмент','management','consulting']),
  ('economics-business-management', 'international-business', 'International Business', array['global business'], 150, array['міжнародний бізнес','business']),
  ('law-governance-policy', 'law', 'Law', array['legal studies'], 210, array['право','law']),
  ('law-governance-policy', 'public-policy-governance', 'Public Policy & Governance', array['governance','public administration'], 220, array['врядування','policy','governance']),
  ('law-governance-policy', 'political-science', 'Political Science', array['politics'], 230, array['політологія','політичне','political']),
  ('law-governance-policy', 'international-relations', 'International Relations', array['diplomacy','security'], 240, array['міжнародні відносини','російські студії','diplomacy']),
  ('law-governance-policy', 'anticorruption-studies', 'Anticorruption Studies', array['anti-corruption'], 250, array['антикорупційні']),
  ('humanities-culture-languages', 'history', 'History', array['historical studies'], 310, array['історія']),
  ('humanities-culture-languages', 'archaeology', 'Archaeology', array['heritage'], 320, array['археологія']),
  ('humanities-culture-languages', 'philosophy', 'Philosophy', array['ethics'], 330, array['філософія']),
  ('humanities-culture-languages', 'cultural-studies', 'Cultural Studies', array['culture'], 340, array['культурологія','culture','юдаїка']),
  ('humanities-culture-languages', 'linguistics-philology', 'Linguistics & Philology', array['languages','literature'], 350, array['мова','літератур','комунікація','філологія']),
  ('humanities-culture-languages', 'liberal-arts', 'Liberal Arts', array['interdisciplinary'], 360, array['trivium','liberal arts']),
  ('social-behavioral-sciences', 'sociology', 'Sociology', array['social research'], 410, array['соціологія']),
  ('social-behavioral-sciences', 'psychology', 'Psychology', array['behavioral science'], 420, array['психологія']),
  ('social-behavioral-sciences', 'social-work', 'Social Work', array['community practice'], 430, array['соціальна робота']),
  ('natural-health-sciences', 'biology-biotechnology', 'Biology & Biotechnology', array['molecular biology','biotech'], 510, array['біологія','biotechnology','молекулярна']),
  ('natural-health-sciences', 'ecology-environment', 'Ecology & Environmental Protection', array['environment'], 520, array['екологія','environment']),
  ('natural-health-sciences', 'chemistry', 'Chemistry', array['chemical science'], 530, array['хімія']),
  ('natural-health-sciences', 'physics-aerospace', 'Physics & Aerospace Systems', array['aerospace','rocket systems'], 540, array['фізика','aerospace','ракетних','аеродинамічних']),
  ('natural-health-sciences', 'public-health', 'Public Health', array['health systems'], 550, array['громадське здоров','медицина','health']),
  ('research-methods-teaching', 'quantitative-research', 'Quantitative Research', array['statistics','methods'], 610, array['економіка','соціологія','психологія','data','математика']),
  ('research-methods-teaching', 'qualitative-research', 'Qualitative Research', array['interviews','fieldwork'], 620, array['соціологія','культурологія','психологія','історія']),
  ('research-methods-teaching', 'academic-writing-supervision', 'Academic Writing & Supervision', array['thesis','supervision'], 630, array['']),
  ('research-methods-teaching', 'education-management', 'Education Management', array['teaching','learning'], 640, array['управління освітою','education']),
  ('media-communications-design', 'journalism', 'Journalism', array['news media'], 710, array['журналістика']),
  ('media-communications-design', 'public-relations-communications', 'Public Relations & Communications', array['pr','communications'], 720, array['зв’язки з громадськістю','комунікації','communications']),
  ('media-communications-design', 'digital-media-design', 'Digital Media & Design', array['design','media'], 730, array['media','комунікація']);

insert into public.expertise (
  category_id,
  slug,
  name,
  search_aliases,
  sort_order,
  is_active
)
select
  ec.id,
  ce.slug,
  ce.name,
  ce.search_aliases,
  ce.sort_order,
  true
from canonical_expertise ce
join public.expertise_categories ec on ec.slug = ce.category_slug
on conflict (slug) do update
set category_id = excluded.category_id,
    name = excluded.name,
    search_aliases = excluded.search_aliases,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

update public.expertise
set is_active = false,
    updated_at = now()
where slug not in (select slug from canonical_expertise);

insert into public.academic_program_expertise (academic_program_id, expertise_id)
select distinct ap.id, e.id
from public.academic_programs ap
join official_programs op on op.slug = ap.slug
join canonical_expertise ce
  on exists (
    select 1
    from unnest(ce.program_keywords) as keyword(value)
    where keyword.value = ''
       or lower(op.display_name || ' ' || op.slug || ' ' || op.specialty_code)
          like '%' || lower(keyword.value) || '%'
  )
join public.expertise e on e.slug = ce.slug
on conflict do nothing;

alter table public.account_roles enable row level security;
alter table public.profile_academic_programs enable row level security;
alter table public.expertise_categories enable row level security;
alter table public.expertise enable row level security;
alter table public.academic_program_expertise enable row level security;
alter table public.faculty_expertise enable row level security;

drop policy if exists account_roles_select_own_or_admin on public.account_roles;
create policy account_roles_select_own_or_admin
  on public.account_roles
  for select to authenticated
  using (user_id = auth.uid() or private.is_admin(auth.uid()));

drop policy if exists account_roles_insert_own_unfinished on public.account_roles;
create policy account_roles_insert_own_unfinished
  on public.account_roles
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and not exists (
      select 1
      from public.profiles p
      where p.user_id = auth.uid()
        and p.onboarding_completed_at is not null
    )
  );

drop policy if exists account_roles_update_own_unfinished on public.account_roles;
create policy account_roles_update_own_unfinished
  on public.account_roles
  for update to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and not exists (
      select 1
      from public.profiles p
      where p.user_id = auth.uid()
        and p.onboarding_completed_at is not null
    )
  );

drop policy if exists profile_academic_programs_select_allowed_profile on public.profile_academic_programs;
create policy profile_academic_programs_select_allowed_profile
  on public.profile_academic_programs
  for select to authenticated
  using (private.can_view_profile(user_id) or private.is_admin(auth.uid()));

drop policy if exists profile_academic_programs_insert_own_active on public.profile_academic_programs;
create policy profile_academic_programs_insert_own_active
  on public.profile_academic_programs
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and private.is_active_profile(user_id)
    and exists (
      select 1 from public.academic_programs ap
      where ap.id = academic_program_id
        and ap.is_active
    )
  );

drop policy if exists profile_academic_programs_update_own on public.profile_academic_programs;
create policy profile_academic_programs_update_own
  on public.profile_academic_programs
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists profile_academic_programs_delete_own on public.profile_academic_programs;
create policy profile_academic_programs_delete_own
  on public.profile_academic_programs
  for delete to authenticated
  using (user_id = auth.uid());

drop policy if exists expertise_categories_select_active on public.expertise_categories;
create policy expertise_categories_select_active
  on public.expertise_categories
  for select to authenticated
  using (is_active or private.is_admin(auth.uid()));

drop policy if exists expertise_select_active on public.expertise;
create policy expertise_select_active
  on public.expertise
  for select to authenticated
  using (is_active or private.is_admin(auth.uid()));

drop policy if exists academic_program_expertise_select_authenticated on public.academic_program_expertise;
create policy academic_program_expertise_select_authenticated
  on public.academic_program_expertise
  for select to authenticated
  using (
    exists (
      select 1
      from public.academic_programs ap
      where ap.id = academic_program_id
        and ap.is_active
    )
    and exists (
      select 1
      from public.expertise e
      where e.id = expertise_id
        and e.is_active
    )
  );

drop policy if exists faculty_expertise_select_allowed_profile on public.faculty_expertise;
create policy faculty_expertise_select_allowed_profile
  on public.faculty_expertise
  for select to authenticated
  using (private.can_view_profile(user_id) or private.is_admin(auth.uid()));

drop policy if exists faculty_expertise_insert_own_faculty on public.faculty_expertise;
create policy faculty_expertise_insert_own_faculty
  on public.faculty_expertise
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.profiles p
      where p.user_id = auth.uid()
        and p.account_role = 'faculty'::public.account_role
        and p.profile_status = 'active'::public.profile_status
        and p.deleted_at is null
    )
    and exists (
      select 1
      from public.expertise e
      where e.id = expertise_id
        and e.is_active
    )
  );

drop policy if exists faculty_expertise_delete_own on public.faculty_expertise;
create policy faculty_expertise_delete_own
  on public.faculty_expertise
  for delete to authenticated
  using (user_id = auth.uid());

grant select, insert, update on public.account_roles to authenticated;
grant select, insert, update, delete on public.profile_academic_programs to authenticated;
grant select on public.expertise_categories to authenticated;
grant select on public.expertise to authenticated;
grant select on public.academic_program_expertise to authenticated;
grant select, insert, delete on public.faculty_expertise to authenticated;
grant usage on sequence public.expertise_categories_id_seq to authenticated;
grant usage on sequence public.expertise_id_seq to authenticated;

create or replace function public.save_account_role(selected_role public.account_role)
returns public.account_role
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
begin
  if caller_id is null then
    raise exception 'Authentication required to choose account role.'
      using errcode = '42501';
  end if;

  if selected_role not in ('student'::public.account_role, 'faculty'::public.account_role) then
    raise exception 'Choose a valid account role.'
      using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from public.profiles p
    where p.user_id = caller_id
      and p.onboarding_completed_at is not null
  ) then
    raise exception 'Completed account roles cannot be changed.'
      using errcode = '42501';
  end if;

  insert into public.account_roles (user_id, account_role)
  values (caller_id, selected_role)
  on conflict (user_id) do update
  set account_role = excluded.account_role,
      updated_at = now();

  return selected_role;
end;
$$;

create or replace function public.update_faculty_profile(
  profile_full_name text,
  primary_academic_program_id bigint,
  additional_academic_program_ids bigint[],
  expertise_ids bigint[],
  research_interest_ids bigint[],
  profile_bio text,
  profile_availability text,
  profile_allow_direct_contact boolean default false
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  normalized_full_name text := nullif(btrim(profile_full_name), '');
  normalized_bio text := nullif(btrim(coalesce(profile_bio, '')), '');
  normalized_availability text := nullif(btrim(coalesce(profile_availability, '')), '');
  normalized_additional_program_ids bigint[];
  normalized_expertise_ids bigint[];
  normalized_interest_ids bigint[];
  selected_faculty_id bigint;
  active_count integer;
begin
  if caller_id is null then
    raise exception 'Authentication required to update faculty profile.'
      using errcode = '42501';
  end if;

  select coalesce(array_agg(distinct raw_id order by raw_id), '{}'::bigint[])
    into normalized_additional_program_ids
  from unnest(coalesce(additional_academic_program_ids, '{}'::bigint[])) as input(raw_id)
  where raw_id > 0 and raw_id <> primary_academic_program_id;

  select coalesce(array_agg(distinct raw_id order by raw_id), '{}'::bigint[])
    into normalized_expertise_ids
  from unnest(coalesce(expertise_ids, '{}'::bigint[])) as input(raw_id)
  where raw_id > 0;

  select coalesce(array_agg(distinct raw_id order by raw_id), '{}'::bigint[])
    into normalized_interest_ids
  from unnest(coalesce(research_interest_ids, '{}'::bigint[])) as input(raw_id)
  where raw_id > 0;

  if normalized_full_name is null
    or char_length(normalized_full_name) < 2
    or char_length(normalized_full_name) > 120
  then
    raise exception 'Full name must be 2-120 characters.'
      using errcode = 'P0001';
  end if;

  if normalized_bio is not null and char_length(normalized_bio) > 500 then
    raise exception 'Bio is limited to 500 characters.'
      using errcode = 'P0001';
  end if;

  if normalized_availability is not null and char_length(normalized_availability) > 160 then
    raise exception 'Availability is limited to 160 characters.'
      using errcode = 'P0001';
  end if;

  if cardinality(normalized_expertise_ids) < 1 then
    raise exception 'Choose at least one expertise area.'
      using errcode = 'P0001';
  end if;

  select ap.faculty_id
    into selected_faculty_id
  from public.academic_programs ap
  where ap.id = primary_academic_program_id
    and ap.is_active;

  if selected_faculty_id is null then
    raise exception 'Choose an active primary academic program.'
      using errcode = 'P0001';
  end if;

  select count(*)::integer
    into active_count
  from public.academic_programs ap
  where ap.id = any(normalized_additional_program_ids)
    and ap.is_active;

  if active_count <> cardinality(normalized_additional_program_ids) then
    raise exception 'Additional academic programs must be active.'
      using errcode = 'P0001';
  end if;

  select count(*)::integer
    into active_count
  from public.expertise e
  where e.id = any(normalized_expertise_ids)
    and e.is_active;

  if active_count <> cardinality(normalized_expertise_ids) then
    raise exception 'Expertise areas must be active.'
      using errcode = 'P0001';
  end if;

  select count(*)::integer
    into active_count
  from public.interests i
  where i.id = any(normalized_interest_ids)
    and i.is_active;

  if active_count <> cardinality(normalized_interest_ids) then
    raise exception 'Research interests must be active.'
      using errcode = 'P0001';
  end if;

  insert into public.account_roles (user_id, account_role)
  values (caller_id, 'faculty'::public.account_role)
  on conflict (user_id) do update
  set account_role = excluded.account_role,
      updated_at = now();

  insert into public.profiles (
    user_id,
    full_name,
    faculty_id,
    academic_program_id,
    year_of_study,
    bio,
    availability,
    allow_direct_contact,
    account_role,
    faculty_verification_status
  )
  values (
    caller_id,
    normalized_full_name,
    selected_faculty_id,
    primary_academic_program_id,
    null,
    normalized_bio,
    normalized_availability,
    coalesce(profile_allow_direct_contact, false),
    'faculty'::public.account_role,
    'unverified'::public.faculty_verification_status
  )
  on conflict (user_id) do update
  set full_name = excluded.full_name,
      faculty_id = excluded.faculty_id,
      academic_program_id = excluded.academic_program_id,
      year_of_study = null,
      bio = excluded.bio,
      availability = excluded.availability,
      allow_direct_contact = excluded.allow_direct_contact,
      account_role = 'faculty'::public.account_role,
      updated_at = now();

  delete from public.profile_academic_programs
  where user_id = caller_id;

  insert into public.profile_academic_programs (user_id, academic_program_id, is_primary)
  values (caller_id, primary_academic_program_id, true);

  insert into public.profile_academic_programs (user_id, academic_program_id, is_primary)
  select caller_id, program_id, false
  from unnest(normalized_additional_program_ids) as selected_programs(program_id)
  on conflict (user_id, academic_program_id) do update
  set is_primary = excluded.is_primary;

  delete from public.faculty_expertise
  where user_id = caller_id;

  insert into public.faculty_expertise (user_id, expertise_id)
  select caller_id, expertise_id
  from unnest(normalized_expertise_ids) as selected_expertise(expertise_id);

  delete from public.profile_interests
  where user_id = caller_id;

  insert into public.profile_interests (user_id, interest_id)
  select caller_id, interest_id
  from unnest(normalized_interest_ids) as selected_interests(interest_id);

  delete from public.profile_skills
  where user_id = caller_id;

  delete from public.profile_collaboration_goals
  where user_id = caller_id;
end;
$$;

create or replace function private.has_complete_onboarding_data(check_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    exists (
      select 1
      from public.profiles p
      join public.faculties f on f.id = p.faculty_id
      join public.academic_programs ap
        on ap.id = p.academic_program_id
        and ap.faculty_id = p.faculty_id
      where p.user_id = check_user_id
        and p.profile_status = 'active'::public.profile_status
        and p.deleted_at is null
        and f.is_active
        and ap.is_active
        and char_length(p.full_name) between 2 and 120
        and (
          (
            p.account_role = 'student'::public.account_role
            and p.year_of_study between 1 and 6
            and (p.bio is null or char_length(p.bio) <= 500)
            and (p.availability is null or char_length(p.availability) <= 160)
            and exists (
              select 1
              from public.profile_skills ps
              join public.skills s on s.id = ps.skill_id
              where ps.user_id = check_user_id
                and ps.direction = 'offer'::public.skill_direction
                and s.is_active
            )
          )
          or (
            p.account_role = 'faculty'::public.account_role
            and p.year_of_study is null
            and (p.bio is null or char_length(p.bio) <= 500)
            and (p.availability is null or char_length(p.availability) <= 160)
            and exists (
              select 1
              from public.profile_academic_programs pap
              join public.academic_programs extra_ap
                on extra_ap.id = pap.academic_program_id
                and extra_ap.is_active
              where pap.user_id = check_user_id
                and pap.is_primary
            )
            and exists (
              select 1
              from public.faculty_expertise fe
              join public.expertise e on e.id = fe.expertise_id
              where fe.user_id = check_user_id
                and e.is_active
            )
          )
        )
    ),
    false
  );
$$;

create or replace function private.can_interact(target_user_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
begin
  if caller_id is null or caller_id = target_user_id then
    return false;
  end if;

  return private.is_active_onboarded_student(caller_id)
    and private.is_active_onboarded_student(target_user_id);
end;
$$;

create or replace function private.can_reveal_direct_contact(target_user_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
begin
  if caller_id is null or target_user_id is null or caller_id = target_user_id then
    return false;
  end if;

  return private.is_active_onboarded_student(caller_id)
    and private.is_active_onboarded_student(target_user_id)
    and exists (
      select 1
      from public.profiles p
      where p.user_id = target_user_id
        and p.account_role = 'student'::public.account_role
        and p.profile_status = 'active'::public.profile_status
        and p.deleted_at is null
        and p.allow_direct_contact
    )
    and exists (
      select 1
      from auth.users u
      where u.id = target_user_id
        and u.email_confirmed_at is not null
    );
end;
$$;

create or replace function public.get_profile_connection_status(target_user_id uuid)
returns table (
  outgoing_action public.interaction_action,
  is_matched boolean,
  match_id uuid,
  blocked_by_me boolean,
  can_direct_contact boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  with caller as (
    select p.user_id
    from public.profiles p
    where p.user_id = auth.uid()
      and private.is_active_onboarded_student(p.user_id)
  ),
  requested_target as (
    select $1 as user_id
  )
  select
    (
      select i.action
      from public.interactions i
      where i.source_user_id = c.user_id
        and i.target_user_id = rt.user_id
    ) as outgoing_action,
    private.active_match_id(c.user_id, rt.user_id) is not null as is_matched,
    private.active_match_id(c.user_id, rt.user_id) as match_id,
    false as blocked_by_me,
    private.can_reveal_direct_contact(rt.user_id) as can_direct_contact
  from caller c
  cross join requested_target rt
  where rt.user_id <> c.user_id
    and private.is_active_onboarded_student(rt.user_id);
$$;

create or replace function public.get_saved_profiles(saved_limit integer default 50)
returns table (
  saved_at timestamptz,
  user_id uuid,
  full_name text,
  faculty_name text,
  academic_program_name text,
  year_of_study integer,
  bio text,
  availability text,
  system_avatar_key text,
  can_direct_contact boolean,
  offered_skills jsonb,
  looking_for_skills jsonb,
  interests jsonb,
  collaboration_goals jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  with caller as (
    select p.user_id
    from public.profiles p
    where p.user_id = auth.uid()
      and private.is_active_onboarded_student(p.user_id)
  )
  select
    i.updated_at as saved_at,
    p.user_id,
    p.full_name,
    f.display_name as faculty_name,
    ap.display_name as academic_program_name,
    p.year_of_study::integer as year_of_study,
    p.bio,
    p.availability,
    p.system_avatar_key,
    private.can_reveal_direct_contact(p.user_id) as can_direct_contact,
    (
      select coalesce(
        jsonb_agg(
          jsonb_build_object('id', s.id, 'slug', s.slug, 'name', s.name, 'category', s.category)
          order by s.sort_order, s.name
        ),
        '[]'::jsonb
      )
      from public.profile_skills ps
      join public.skills s on s.id = ps.skill_id
      where ps.user_id = p.user_id
        and ps.direction = 'offer'::public.skill_direction
        and s.is_active
    ) as offered_skills,
    (
      select coalesce(
        jsonb_agg(
          jsonb_build_object('id', s.id, 'slug', s.slug, 'name', s.name, 'category', s.category)
          order by s.sort_order, s.name
        ),
        '[]'::jsonb
      )
      from public.profile_skills ps
      join public.skills s on s.id = ps.skill_id
      where ps.user_id = p.user_id
        and ps.direction = 'looking_for'::public.skill_direction
        and s.is_active
    ) as looking_for_skills,
    (
      select coalesce(
        jsonb_agg(
          jsonb_build_object('id', interest.id, 'slug', interest.slug, 'name', interest.name)
          order by interest.sort_order, interest.name
        ),
        '[]'::jsonb
      )
      from public.profile_interests pi
      join public.interests interest on interest.id = pi.interest_id
      where pi.user_id = p.user_id
        and interest.is_active
    ) as interests,
    (
      select coalesce(
        jsonb_agg(
          jsonb_build_object('id', goal.id, 'slug', goal.slug, 'name', goal.name)
          order by goal.sort_order, goal.name
        ),
        '[]'::jsonb
      )
      from public.profile_collaboration_goals pcg
      join public.collaboration_goals goal on goal.id = pcg.collaboration_goal_id
      where pcg.user_id = p.user_id
        and goal.is_active
    ) as collaboration_goals
  from caller c
  join public.interactions i
    on i.source_user_id = c.user_id
    and i.action = 'save'::public.interaction_action
  join public.profiles p on p.user_id = i.target_user_id
  join public.faculties f on f.id = p.faculty_id and f.is_active
  join public.academic_programs ap
    on ap.id = p.academic_program_id
    and ap.faculty_id = p.faculty_id
    and ap.is_active
  where private.is_active_onboarded_student(p.user_id)
  order by i.updated_at desc, p.full_name asc, p.user_id asc
  limit least(greatest(coalesce(saved_limit, 50), 1), 100);
$$;

create or replace function public.get_my_matches(match_limit integer default 50)
returns table (
  match_id uuid,
  matched_at timestamptz,
  user_id uuid,
  full_name text,
  faculty_name text,
  academic_program_name text,
  year_of_study integer,
  bio text,
  availability text,
  system_avatar_key text,
  can_direct_contact boolean,
  offered_skills jsonb,
  looking_for_skills jsonb,
  interests jsonb,
  collaboration_goals jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  with caller as (
    select p.user_id
    from public.profiles p
    where p.user_id = auth.uid()
      and private.is_active_onboarded_student(p.user_id)
  ),
  visible_matches as (
    select
      m.id as match_id,
      m.created_at as matched_at,
      case when m.user_low = c.user_id then m.user_high else m.user_low end as other_user_id
    from caller c
    join public.matches m
      on (m.user_low = c.user_id or m.user_high = c.user_id)
      and m.status = 'active'::public.match_status
  )
  select
    vm.match_id,
    vm.matched_at,
    p.user_id,
    p.full_name,
    f.display_name as faculty_name,
    ap.display_name as academic_program_name,
    p.year_of_study::integer as year_of_study,
    p.bio,
    p.availability,
    p.system_avatar_key,
    private.can_reveal_direct_contact(p.user_id) as can_direct_contact,
    (
      select coalesce(
        jsonb_agg(
          jsonb_build_object('id', s.id, 'slug', s.slug, 'name', s.name, 'category', s.category)
          order by s.sort_order, s.name
        ),
        '[]'::jsonb
      )
      from public.profile_skills ps
      join public.skills s on s.id = ps.skill_id
      where ps.user_id = p.user_id
        and ps.direction = 'offer'::public.skill_direction
        and s.is_active
    ) as offered_skills,
    (
      select coalesce(
        jsonb_agg(
          jsonb_build_object('id', s.id, 'slug', s.slug, 'name', s.name, 'category', s.category)
          order by s.sort_order, s.name
        ),
        '[]'::jsonb
      )
      from public.profile_skills ps
      join public.skills s on s.id = ps.skill_id
      where ps.user_id = p.user_id
        and ps.direction = 'looking_for'::public.skill_direction
        and s.is_active
    ) as looking_for_skills,
    (
      select coalesce(
        jsonb_agg(
          jsonb_build_object('id', interest.id, 'slug', interest.slug, 'name', interest.name)
          order by interest.sort_order, interest.name
        ),
        '[]'::jsonb
      )
      from public.profile_interests pi
      join public.interests interest on interest.id = pi.interest_id
      where pi.user_id = p.user_id
        and interest.is_active
    ) as interests,
    (
      select coalesce(
        jsonb_agg(
          jsonb_build_object('id', goal.id, 'slug', goal.slug, 'name', goal.name)
          order by goal.sort_order, goal.name
        ),
        '[]'::jsonb
      )
      from public.profile_collaboration_goals pcg
      join public.collaboration_goals goal on goal.id = pcg.collaboration_goal_id
      where pcg.user_id = p.user_id
        and goal.is_active
    ) as collaboration_goals
  from visible_matches vm
  join public.profiles p on p.user_id = vm.other_user_id
  join public.faculties f on f.id = p.faculty_id and f.is_active
  join public.academic_programs ap
    on ap.id = p.academic_program_id
    and ap.faculty_id = p.faculty_id
    and ap.is_active
  where private.is_active_onboarded_student(p.user_id)
  order by vm.matched_at desc, p.full_name asc, p.user_id asc
  limit least(greatest(coalesce(match_limit, 50), 1), 100);
$$;

create or replace function public.get_discovery_candidates(candidate_limit integer default 12)
returns table (
  user_id uuid,
  full_name text,
  faculty_name text,
  academic_program_name text,
  year_of_study integer,
  bio text,
  availability text,
  system_avatar_key text,
  compatibility_score integer,
  score_breakdown jsonb,
  offered_skills jsonb,
  looking_for_skills jsonb,
  interests jsonb,
  collaboration_goals jsonb,
  matched_they_offer jsonb,
  matched_i_offer jsonb,
  shared_interests jsonb,
  shared_collaboration_goals jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  with caller as (
    select p.user_id, p.availability
    from public.profiles p
    where p.user_id = auth.uid()
      and p.account_role = 'student'::public.account_role
      and private.is_active_onboarded(p.user_id)
  ),
  active_config as (
    select mc.*
    from public.matching_config mc
    where mc.is_active
    order by mc.version desc
    limit 1
  ),
  caller_sets as (
    select
      c.user_id,
      c.availability,
      array(
        select ps.skill_id
        from public.profile_skills ps
        join public.skills s on s.id = ps.skill_id
        where ps.user_id = c.user_id
          and ps.direction = 'offer'::public.skill_direction
          and s.is_active
        order by s.sort_order, s.name
      ) as offer_skill_ids,
      array(
        select ps.skill_id
        from public.profile_skills ps
        join public.skills s on s.id = ps.skill_id
        where ps.user_id = c.user_id
          and ps.direction = 'looking_for'::public.skill_direction
          and s.is_active
        order by s.sort_order, s.name
      ) as looking_for_skill_ids,
      array(
        select pi.interest_id
        from public.profile_interests pi
        join public.interests i on i.id = pi.interest_id
        where pi.user_id = c.user_id
          and i.is_active
        order by i.sort_order, i.name
      ) as interest_ids,
      array(
        select pcg.collaboration_goal_id
        from public.profile_collaboration_goals pcg
        join public.collaboration_goals cg on cg.id = pcg.collaboration_goal_id
        where pcg.user_id = c.user_id
          and cg.is_active
        order by cg.sort_order, cg.name
      ) as collaboration_goal_ids
    from caller c
  ),
  candidate_profiles as (
    select
      p.user_id,
      p.full_name,
      f.display_name as faculty_name,
      ap.display_name as academic_program_name,
      p.year_of_study::integer as year_of_study,
      p.bio,
      p.availability,
      p.system_avatar_key
    from caller_sets cs
    join public.profiles p on p.user_id <> cs.user_id
    join public.faculties f on f.id = p.faculty_id and f.is_active
    join public.academic_programs ap
      on ap.id = p.academic_program_id
      and ap.faculty_id = p.faculty_id
      and ap.is_active
    where p.account_role = 'student'::public.account_role
      and private.is_active_onboarded(p.user_id)
      and private.active_match_id(cs.user_id, p.user_id) is null
      and not exists (
        select 1
        from public.interactions existing
        where existing.source_user_id = cs.user_id
          and existing.target_user_id = p.user_id
      )
  ),
  candidate_sets as (
    select
      cp.*,
      array(
        select ps.skill_id
        from public.profile_skills ps
        join public.skills s on s.id = ps.skill_id
        where ps.user_id = cp.user_id
          and ps.direction = 'offer'::public.skill_direction
          and s.is_active
        order by s.sort_order, s.name
      ) as offer_skill_ids,
      array(
        select ps.skill_id
        from public.profile_skills ps
        join public.skills s on s.id = ps.skill_id
        where ps.user_id = cp.user_id
          and ps.direction = 'looking_for'::public.skill_direction
          and s.is_active
        order by s.sort_order, s.name
      ) as looking_for_skill_ids,
      array(
        select pi.interest_id
        from public.profile_interests pi
        join public.interests i on i.id = pi.interest_id
        where pi.user_id = cp.user_id
          and i.is_active
        order by i.sort_order, i.name
      ) as interest_ids,
      array(
        select pcg.collaboration_goal_id
        from public.profile_collaboration_goals pcg
        join public.collaboration_goals cg on cg.id = pcg.collaboration_goal_id
        where pcg.user_id = cp.user_id
          and cg.is_active
        order by cg.sort_order, cg.name
      ) as collaboration_goal_ids
    from candidate_profiles cp
  ),
  score_counts as (
    select
      c.*,
      cs.user_id as caller_id,
      cs.availability as caller_availability,
      cs.offer_skill_ids as caller_offer_skill_ids,
      cs.looking_for_skill_ids as caller_looking_for_skill_ids,
      cs.interest_ids as caller_interest_ids,
      cs.collaboration_goal_ids as caller_collaboration_goal_ids,
      ac.version as config_version,
      ac.my_looking_for_their_offer_weight,
      ac.their_looking_for_my_offer_weight,
      ac.common_interests_weight,
      ac.collaboration_goals_weight,
      ac.availability_weight,
      cardinality(cs.looking_for_skill_ids)::numeric as my_looking_for_count,
      cardinality(c.looking_for_skill_ids)::numeric as their_looking_for_count,
      (
        select count(*)::numeric
        from unnest(cs.looking_for_skill_ids) desired(skill_id)
        where desired.skill_id = any(c.offer_skill_ids)
      ) as my_looking_for_matches,
      (
        select count(*)::numeric
        from unnest(c.looking_for_skill_ids) desired(skill_id)
        where desired.skill_id = any(cs.offer_skill_ids)
      ) as their_looking_for_matches,
      (
        select count(*)::numeric
        from unnest(cs.interest_ids) mine(interest_id)
        where mine.interest_id = any(c.interest_ids)
      ) as shared_interest_count,
      (
        select count(*)::numeric
        from (
          select unnest(cs.interest_ids) as interest_id
          union
          select unnest(c.interest_ids) as interest_id
        ) unioned_interests
      ) as interest_union_count,
      (
        select count(*)::numeric
        from unnest(cs.collaboration_goal_ids) mine(collaboration_goal_id)
        where mine.collaboration_goal_id = any(c.collaboration_goal_ids)
      ) as shared_goal_count,
      (
        select count(*)::numeric
        from (
          select unnest(cs.collaboration_goal_ids) as collaboration_goal_id
          union
          select unnest(c.collaboration_goal_ids) as collaboration_goal_id
        ) unioned_goals
      ) as goal_union_count
    from candidate_sets c
    cross join caller_sets cs
    cross join active_config ac
  ),
  scored as (
    select
      sc.*,
      case
        when sc.my_looking_for_count = 0 then null
        else sc.my_looking_for_matches / sc.my_looking_for_count
      end as my_looking_for_ratio,
      case
        when sc.their_looking_for_count = 0 then null
        else sc.their_looking_for_matches / sc.their_looking_for_count
      end as their_looking_for_ratio,
      case
        when sc.interest_union_count = 0 then null
        else sc.shared_interest_count / sc.interest_union_count
      end as shared_interest_ratio,
      case
        when sc.goal_union_count = 0 then null
        else sc.shared_goal_count / sc.goal_union_count
      end as shared_goal_ratio,
      case
        when sc.availability_weight = 0 then null
        when nullif(btrim(coalesce(sc.caller_availability, '')), '') is null
          or nullif(btrim(coalesce(sc.availability, '')), '') is null
        then null
        when lower(btrim(sc.caller_availability)) = lower(btrim(sc.availability)) then 1::numeric
        else 0::numeric
      end as availability_ratio
    from score_counts sc
  ),
  final_scores as (
    select
      s.*,
      (
        case when s.my_looking_for_ratio is null or s.my_looking_for_their_offer_weight = 0 then 0 else s.my_looking_for_their_offer_weight end
        + case when s.their_looking_for_ratio is null or s.their_looking_for_my_offer_weight = 0 then 0 else s.their_looking_for_my_offer_weight end
        + case when s.shared_interest_ratio is null or s.common_interests_weight = 0 then 0 else s.common_interests_weight end
        + case when s.shared_goal_ratio is null or s.collaboration_goals_weight = 0 then 0 else s.collaboration_goals_weight end
        + case when s.availability_ratio is null or s.availability_weight = 0 then 0 else s.availability_weight end
      )::numeric as applicable_weight,
      (
        coalesce(s.my_looking_for_ratio * s.my_looking_for_their_offer_weight, 0)
        + coalesce(s.their_looking_for_ratio * s.their_looking_for_my_offer_weight, 0)
        + coalesce(s.shared_interest_ratio * s.common_interests_weight, 0)
        + coalesce(s.shared_goal_ratio * s.collaboration_goals_weight, 0)
        + coalesce(s.availability_ratio * s.availability_weight, 0)
      )::numeric as weighted_score
    from scored s
  )
  select
    fs.user_id,
    fs.full_name,
    fs.faculty_name,
    fs.academic_program_name,
    fs.year_of_study,
    fs.bio,
    fs.availability,
    fs.system_avatar_key,
    coalesce(round(100 * fs.weighted_score / nullif(fs.applicable_weight, 0))::integer, 0) as compatibility_score,
    jsonb_build_object(
      'configVersion', fs.config_version,
      'weights', jsonb_build_object(
        'myLookingForTheirOffer', fs.my_looking_for_their_offer_weight,
        'theirLookingForMyOffer', fs.their_looking_for_my_offer_weight,
        'commonInterests', fs.common_interests_weight,
        'collaborationGoals', fs.collaboration_goals_weight,
        'availability', fs.availability_weight
      ),
      'counts', jsonb_build_object(
        'myLookingForMatches', fs.my_looking_for_matches,
        'myLookingForTotal', fs.my_looking_for_count,
        'theirLookingForMatches', fs.their_looking_for_matches,
        'theirLookingForTotal', fs.their_looking_for_count,
        'sharedInterests', fs.shared_interest_count,
        'interestUnion', fs.interest_union_count,
        'sharedCollaborationGoals', fs.shared_goal_count,
        'collaborationGoalUnion', fs.goal_union_count
      )
    ) as score_breakdown,
    (
      select coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'slug', s.slug, 'name', s.name, 'category', s.category) order by s.sort_order, s.name), '[]'::jsonb)
      from public.profile_skills ps
      join public.skills s on s.id = ps.skill_id
      where ps.user_id = fs.user_id
        and ps.direction = 'offer'::public.skill_direction
        and s.is_active
    ) as offered_skills,
    (
      select coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'slug', s.slug, 'name', s.name, 'category', s.category) order by s.sort_order, s.name), '[]'::jsonb)
      from public.profile_skills ps
      join public.skills s on s.id = ps.skill_id
      where ps.user_id = fs.user_id
        and ps.direction = 'looking_for'::public.skill_direction
        and s.is_active
    ) as looking_for_skills,
    (
      select coalesce(jsonb_agg(jsonb_build_object('id', i.id, 'slug', i.slug, 'name', i.name) order by i.sort_order, i.name), '[]'::jsonb)
      from public.profile_interests pi
      join public.interests i on i.id = pi.interest_id
      where pi.user_id = fs.user_id
        and i.is_active
    ) as interests,
    (
      select coalesce(jsonb_agg(jsonb_build_object('id', cg.id, 'slug', cg.slug, 'name', cg.name) order by cg.sort_order, cg.name), '[]'::jsonb)
      from public.profile_collaboration_goals pcg
      join public.collaboration_goals cg on cg.id = pcg.collaboration_goal_id
      where pcg.user_id = fs.user_id
        and cg.is_active
    ) as collaboration_goals,
    (
      select coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'slug', s.slug, 'name', s.name, 'category', s.category) order by s.sort_order, s.name), '[]'::jsonb)
      from public.skills s
      where s.id = any(fs.caller_looking_for_skill_ids)
        and s.id = any(fs.offer_skill_ids)
        and s.is_active
    ) as matched_they_offer,
    (
      select coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'slug', s.slug, 'name', s.name, 'category', s.category) order by s.sort_order, s.name), '[]'::jsonb)
      from public.skills s
      where s.id = any(fs.looking_for_skill_ids)
        and s.id = any(fs.caller_offer_skill_ids)
        and s.is_active
    ) as matched_i_offer,
    (
      select coalesce(jsonb_agg(jsonb_build_object('id', i.id, 'slug', i.slug, 'name', i.name) order by i.sort_order, i.name), '[]'::jsonb)
      from public.interests i
      where i.id = any(fs.caller_interest_ids)
        and i.id = any(fs.interest_ids)
        and i.is_active
    ) as shared_interests,
    (
      select coalesce(jsonb_agg(jsonb_build_object('id', cg.id, 'slug', cg.slug, 'name', cg.name) order by cg.sort_order, cg.name), '[]'::jsonb)
      from public.collaboration_goals cg
      where cg.id = any(fs.caller_collaboration_goal_ids)
        and cg.id = any(fs.collaboration_goal_ids)
        and cg.is_active
    ) as shared_collaboration_goals
  from final_scores fs
  order by compatibility_score desc, full_name asc, user_id asc
  limit least(greatest(coalesce(candidate_limit, 12), 1), 50);
$$;

create or replace function public.get_all_discovery_profiles(profile_limit integer default null)
returns table (
  user_id uuid,
  full_name text,
  faculty_name text,
  academic_program_name text,
  year_of_study integer,
  bio text,
  availability text,
  system_avatar_key text,
  compatibility_score integer,
  score_breakdown jsonb,
  offered_skills jsonb,
  looking_for_skills jsonb,
  interests jsonb,
  collaboration_goals jsonb,
  matched_they_offer jsonb,
  matched_i_offer jsonb,
  shared_interests jsonb,
  shared_collaboration_goals jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  with caller as (
    select p.user_id
    from public.profiles p
    where p.user_id = auth.uid()
      and p.account_role = 'student'::public.account_role
      and private.is_active_onboarded(p.user_id)
  ),
  visible_profiles as (
    select
      p.user_id,
      p.full_name,
      f.display_name as faculty_name,
      ap.display_name as academic_program_name,
      p.year_of_study::integer as year_of_study,
      p.bio,
      p.availability,
      p.system_avatar_key
    from caller c
    join public.profiles p on p.user_id <> c.user_id
    join public.faculties f on f.id = p.faculty_id and f.is_active
    join public.academic_programs ap
      on ap.id = p.academic_program_id
      and ap.faculty_id = p.faculty_id
      and ap.is_active
    where p.account_role = 'student'::public.account_role
      and private.is_active_onboarded(p.user_id)
  )
  select
    vp.user_id,
    vp.full_name,
    vp.faculty_name,
    vp.academic_program_name,
    vp.year_of_study,
    vp.bio,
    vp.availability,
    vp.system_avatar_key,
    0 as compatibility_score,
    jsonb_build_object('source', 'all_students') as score_breakdown,
    (
      select coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'slug', s.slug, 'name', s.name, 'category', s.category) order by s.sort_order, s.name), '[]'::jsonb)
      from public.profile_skills ps
      join public.skills s on s.id = ps.skill_id
      where ps.user_id = vp.user_id
        and ps.direction = 'offer'::public.skill_direction
        and s.is_active
    ) as offered_skills,
    (
      select coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'slug', s.slug, 'name', s.name, 'category', s.category) order by s.sort_order, s.name), '[]'::jsonb)
      from public.profile_skills ps
      join public.skills s on s.id = ps.skill_id
      where ps.user_id = vp.user_id
        and ps.direction = 'looking_for'::public.skill_direction
        and s.is_active
    ) as looking_for_skills,
    (
      select coalesce(jsonb_agg(jsonb_build_object('id', interest.id, 'slug', interest.slug, 'name', interest.name) order by interest.sort_order, interest.name), '[]'::jsonb)
      from public.profile_interests pi
      join public.interests interest on interest.id = pi.interest_id
      where pi.user_id = vp.user_id
        and interest.is_active
    ) as interests,
    (
      select coalesce(jsonb_agg(jsonb_build_object('id', goal.id, 'slug', goal.slug, 'name', goal.name) order by goal.sort_order, goal.name), '[]'::jsonb)
      from public.profile_collaboration_goals pcg
      join public.collaboration_goals goal on goal.id = pcg.collaboration_goal_id
      where pcg.user_id = vp.user_id
        and goal.is_active
    ) as collaboration_goals,
    '[]'::jsonb as matched_they_offer,
    '[]'::jsonb as matched_i_offer,
    '[]'::jsonb as shared_interests,
    '[]'::jsonb as shared_collaboration_goals
  from visible_profiles vp
  order by vp.full_name asc, vp.user_id asc
  limit case
    when profile_limit is null then null
    else least(greatest(profile_limit, 1), 500)
  end;
$$;

create or replace function public.get_faculty_discovery_profiles(profile_limit integer default 500)
returns table (
  user_id uuid,
  full_name text,
  faculty_name text,
  primary_academic_program_name text,
  bio text,
  availability text,
  system_avatar_key text,
  verification_status public.faculty_verification_status,
  academic_programs jsonb,
  expertise jsonb,
  research_interests jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  with caller as (
    select p.user_id
    from public.profiles p
    where p.user_id = auth.uid()
      and private.is_active_onboarded(p.user_id)
  ),
  visible_faculty as (
    select
      p.user_id,
      p.full_name,
      f.display_name as faculty_name,
      ap.display_name as primary_academic_program_name,
      p.bio,
      p.availability,
      p.system_avatar_key,
      p.faculty_verification_status as verification_status
    from caller c
    join public.profiles p on p.user_id <> c.user_id
    join public.faculties f on f.id = p.faculty_id and f.is_active
    join public.academic_programs ap
      on ap.id = p.academic_program_id
      and ap.faculty_id = p.faculty_id
      and ap.is_active
    where p.account_role = 'faculty'::public.account_role
      and private.is_active_onboarded(p.user_id)
  )
  select
    vf.user_id,
    vf.full_name,
    vf.faculty_name,
    vf.primary_academic_program_name,
    vf.bio,
    vf.availability,
    vf.system_avatar_key,
    vf.verification_status,
    (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', ap.id,
            'slug', ap.slug,
            'name', ap.display_name,
            'facultyName', f.display_name,
            'studyLevel', ap.study_level,
            'specialtyCode', ap.specialty_code,
            'isPrimary', pap.is_primary
          )
          order by pap.is_primary desc, ap.sort_order, ap.display_name
        ),
        '[]'::jsonb
      )
      from public.profile_academic_programs pap
      join public.academic_programs ap on ap.id = pap.academic_program_id and ap.is_active
      join public.faculties f on f.id = ap.faculty_id and f.is_active
      where pap.user_id = vf.user_id
    ) as academic_programs,
    (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', e.id,
            'slug', e.slug,
            'name', e.name,
            'category', ec.name
          )
          order by ec.sort_order, e.sort_order, e.name
        ),
        '[]'::jsonb
      )
      from public.faculty_expertise fe
      join public.expertise e on e.id = fe.expertise_id and e.is_active
      join public.expertise_categories ec on ec.id = e.category_id and ec.is_active
      where fe.user_id = vf.user_id
    ) as expertise,
    (
      select coalesce(
        jsonb_agg(
          jsonb_build_object('id', i.id, 'slug', i.slug, 'name', i.name)
          order by i.sort_order, i.name
        ),
        '[]'::jsonb
      )
      from public.profile_interests pi
      join public.interests i on i.id = pi.interest_id
      where pi.user_id = vf.user_id
        and i.is_active
    ) as research_interests
  from visible_faculty vf
  order by
    case vf.verification_status
      when 'verified'::public.faculty_verification_status then 0
      else 1
    end,
    vf.full_name asc,
    vf.user_id asc
  limit least(greatest(coalesce(profile_limit, 500), 1), 500);
$$;

revoke execute on function private.get_account_role(uuid)
  from public, anon, authenticated;
revoke execute on function private.is_active_onboarded_student(uuid)
  from public, anon, authenticated;
revoke execute on function private.prevent_profile_self_verification()
  from public, anon, authenticated;
revoke execute on function public.save_account_role(public.account_role)
  from public, anon, authenticated;
revoke execute on function public.update_faculty_profile(
  text,
  bigint,
  bigint[],
  bigint[],
  bigint[],
  text,
  text,
  boolean
) from public, anon, authenticated;
revoke execute on function public.get_faculty_discovery_profiles(integer)
  from public, anon, authenticated;

grant execute on function public.save_account_role(public.account_role)
  to authenticated;
grant execute on function public.update_faculty_profile(
  text,
  bigint,
  bigint[],
  bigint[],
  bigint[],
  text,
  text,
  boolean
) to authenticated;
grant execute on function public.get_faculty_discovery_profiles(integer)
  to authenticated;

comment on column public.profiles.account_role is
  'Mohyla Match account role. Existing accounts default to student; faculty accounts use separate onboarding and discovery.';
comment on column public.profiles.faculty_verification_status is
  'Faculty verification is administrator-controlled. Users cannot self-verify.';
comment on table public.account_roles is
  'Pre-profile role selection used during onboarding before a full profile row exists.';
comment on table public.expertise is
  'Canonical faculty expertise taxonomy shown in faculty onboarding and discovery.';
comment on table public.academic_program_expertise is
  'Many-to-many suggestions linking official NaUKMA academic programs to faculty expertise areas.';
comment on function public.get_faculty_discovery_profiles(integer) is
  'Returns safe faculty directory summaries for authenticated active users. Emails are intentionally excluded and faculty rows never participate in student matching.';
comment on function public.get_all_discovery_profiles(integer) is
  'Returns safe student directory summaries only. Faculty accounts are intentionally excluded from All students.';

commit;
