begin;

create temp table canonical_faculties (
  slug text primary key,
  display_name text not null,
  avatar_theme_key text not null,
  sort_order integer not null
) on commit drop;

insert into canonical_faculties (slug, display_name, avatar_theme_key, sort_order)
values
  ('faculty-humanities', 'Факультет гуманітарних наук', 'faculty-humanities', 10),
  ('faculty-economics', 'Факультет економічних наук', 'faculty-economics', 20),
  ('faculty-social-sciences-social-technologies', 'Факультет соціальних наук та соціальних технологій', 'faculty-social-sciences', 30),
  ('faculty-informatics', 'Факультет інформатики', 'faculty-informatics', 40),
  ('faculty-law', 'Факультет правничих наук', 'faculty-law', 50),
  ('faculty-natural-sciences', 'Факультет природничих наук', 'faculty-natural-sciences', 60),
  ('faculty-health-social-work-psychology', 'Факультет охорони здоров’я, соціальної роботи та психології', 'faculty-health-social-work-psychology', 70);

insert into public.faculties (slug, display_name, avatar_theme_key, sort_order, is_active)
select slug, display_name, avatar_theme_key, sort_order, true
from canonical_faculties
on conflict (slug) do update
set display_name = excluded.display_name,
    avatar_theme_key = excluded.avatar_theme_key,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

create temp table canonical_programs (
  faculty_slug text not null,
  slug text primary key,
  display_name text not null,
  avatar_variant_key text not null,
  specialty_code text,
  sort_order integer not null
) on commit drop;

insert into canonical_programs (
  faculty_slug,
  slug,
  display_name,
  avatar_variant_key,
  specialty_code,
  sort_order
)
values
  ('faculty-humanities', 'history-archaeology', 'Історія та археологія', 'program-history', 'B9', 110),
  ('faculty-humanities', 'philosophy', 'Філософія', 'program-philosophy', 'B10', 120),
  ('faculty-humanities', 'cultural-studies', 'Культурологія', 'program-cultural-studies', 'B12', 130),
  ('faculty-humanities', 'philology', 'Філологія', 'program-language-literature-comparative-studies', 'B11', 140),
  ('faculty-economics', 'economics', 'Економіка', 'program-economics', 'C1.01', 210),
  ('faculty-economics', 'finance-banking-insurance', 'Фінанси, банківська справа та страхування', 'program-finance-banking-insurance', 'D2', 220),
  ('faculty-economics', 'management', 'Менеджмент', 'program-management', 'D3', 230),
  ('faculty-economics', 'marketing', 'Маркетинг', 'program-marketing', 'D5', 240),
  ('faculty-social-sciences-social-technologies', 'political-science', 'Політологія', 'program-political-science', 'C2', 310),
  ('faculty-social-sciences-social-technologies', 'sociology', 'Соціологія', 'program-sociology', 'C5', 320),
  ('faculty-social-sciences-social-technologies', 'international-relations-public-communications-regional-studies', 'Міжнародні відносини, суспільні комунікації та регіональні студії', 'program-international-relations-public-communications-regional-studies', 'C3', 330),
  ('faculty-social-sciences-social-technologies', 'journalism', 'Журналістика', 'program-public-relations', 'C7', 340),
  ('faculty-social-sciences-social-technologies', 'social-management', 'Менеджмент', 'program-management', 'D3', 350),
  ('faculty-informatics', 'applied-mathematics', 'Прикладна математика', 'program-applied-mathematics', 'F1', 410),
  ('faculty-informatics', 'software-engineering', 'Інженерія програмного забезпечення', 'program-software-engineering', 'F2', 420),
  ('faculty-informatics', 'computer-science', 'Комп''ютерні науки', 'program-computer-science', 'F3', 430),
  ('faculty-informatics', 'systems-analysis', 'Системний аналіз', 'program-information-systems-vulnerability-analysis', 'F5', 440),
  ('faculty-law', 'law', 'Право', 'program-law', 'D8', 510),
  ('faculty-law', 'public-administration', 'Публічне управління та адміністрування', 'program-public-private-governance', 'D4', 520),
  ('faculty-natural-sciences', 'biology', 'Біологія', 'program-biology-biotechnology', 'E1', 610),
  ('faculty-natural-sciences', 'ecology', 'Екологія', 'program-ecology', 'E2', 620),
  ('faculty-natural-sciences', 'chemistry', 'Хімія', 'program-chemistry', 'E3', 630),
  ('faculty-natural-sciences', 'physics-astronomy', 'Фізика та астрономія', 'program-rocket-aerospace-systems-physics', 'E5', 640),
  ('faculty-health-social-work-psychology', 'psychology', 'Психологія', 'program-psychology', 'C4', 710),
  ('faculty-health-social-work-psychology', 'social-work', 'Соціальна робота', 'program-social-work', 'I10', 720),
  ('faculty-health-social-work-psychology', 'public-health', 'Громадське здоров''я', 'program-medicine', 'I9', 730),
  ('faculty-health-social-work-psychology', 'healthcare-management', 'Менеджмент в охороні здоров''я', 'program-management', 'D3', 740),
  ('faculty-health-social-work-psychology', 'medicine', 'Медицина', 'program-medicine', 'I2', 750);

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
  cp.slug,
  cp.display_name,
  cp.avatar_variant_key,
  'bachelor'::public.academic_program_level,
  cp.specialty_code,
  null,
  cp.sort_order,
  true
from canonical_programs cp
join public.faculties f on f.slug = cp.faculty_slug
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

create temp table legacy_program_map (
  old_slug text primary key,
  canonical_slug text not null references canonical_programs(slug)
) on commit drop;

insert into legacy_program_map (old_slug, canonical_slug)
values
  ('political-leadership-economic-diplomacy', 'international-relations-public-communications-regional-studies'),
  ('master-economic-diplomacy-gr-policies', 'international-relations-public-communications-regional-studies'),
  ('master-city-governance-policy', 'public-administration'),
  ('master-education-management', 'social-management'),
  ('history', 'history-archaeology'),
  ('archaeology', 'history-archaeology'),
  ('master-history', 'history-archaeology'),
  ('master-archaeology', 'history-archaeology'),
  ('philosophy', 'philosophy'),
  ('master-philosophy', 'philosophy'),
  ('cultural-studies', 'cultural-studies'),
  ('master-judaic-studies', 'cultural-studies'),
  ('master-mohyla-cultural-studies', 'cultural-studies'),
  ('english-and-ukrainian-language', 'philology'),
  ('language-literature-comparative-studies', 'philology'),
  ('master-ukrainian-comparative-psycholinguistics', 'philology'),
  ('master-english-ukrainian-languages-communication', 'philology'),
  ('master-literary-theory-history-comparative-studies', 'philology'),
  ('economics', 'economics'),
  ('master-economics', 'economics'),
  ('finance-banking-insurance', 'finance-banking-insurance'),
  ('master-finance-banking-insurance', 'finance-banking-insurance'),
  ('management', 'management'),
  ('master-international-business', 'management'),
  ('master-business-development-management-consulting', 'management'),
  ('marketing', 'marketing'),
  ('master-marketing', 'marketing'),
  ('political-science', 'political-science'),
  ('master-political-science', 'political-science'),
  ('master-anticorruption-studies', 'political-science'),
  ('sociology', 'sociology'),
  ('master-sociology', 'sociology'),
  ('international-relations-public-communications-regional-studies', 'international-relations-public-communications-regional-studies'),
  ('master-international-relations-public-communications-regional-studies', 'international-relations-public-communications-regional-studies'),
  ('master-russian-studies-international-security-challenges', 'international-relations-public-communications-regional-studies'),
  ('public-relations', 'journalism'),
  ('master-journalism', 'journalism'),
  ('master-public-relations', 'journalism'),
  ('applied-mathematics', 'applied-mathematics'),
  ('master-applied-mathematics', 'applied-mathematics'),
  ('big-data-analytics', 'applied-mathematics'),
  ('software-engineering', 'software-engineering'),
  ('master-software-engineering', 'software-engineering'),
  ('computer-science', 'computer-science'),
  ('master-computer-science', 'computer-science'),
  ('information-systems-vulnerability-analysis', 'systems-analysis'),
  ('automation-computer-integrated-technologies-robotics', 'systems-analysis'),
  ('law', 'law'),
  ('master-law', 'law'),
  ('public-private-governance', 'public-administration'),
  ('master-public-policy-governance', 'public-administration'),
  ('biology-biotechnology', 'biology'),
  ('master-molecular-biology', 'biology'),
  ('ecology', 'ecology'),
  ('master-ecology-environmental-protection', 'ecology'),
  ('chemistry', 'chemistry'),
  ('master-chemistry', 'chemistry'),
  ('rocket-aerospace-systems-physics', 'physics-astronomy'),
  ('master-physics-aerodynamic-systems-modeling', 'physics-astronomy'),
  ('psychology', 'psychology'),
  ('master-psychology', 'psychology'),
  ('social-work', 'social-work'),
  ('master-social-work', 'social-work'),
  ('master-public-health', 'public-health'),
  ('master-healthcare-management', 'healthcare-management'),
  ('medicine', 'medicine'),
  ('mohyla-trivium-liberal-arts-sciences', 'cultural-studies');

create temp table program_remap as
select
  old_program.id as old_program_id,
  canonical_program.id as canonical_program_id,
  canonical_program.faculty_id as canonical_faculty_id
from public.academic_programs old_program
join legacy_program_map lpm on lpm.old_slug = old_program.slug
join public.academic_programs canonical_program
  on canonical_program.slug = lpm.canonical_slug
where old_program.id <> canonical_program.id;

create temp table profile_program_rows as
select
  pap.user_id,
  coalesce(pr.canonical_program_id, pap.academic_program_id) as academic_program_id,
  bool_or(pap.is_primary) as is_primary,
  min(pap.created_at) as created_at
from public.profile_academic_programs pap
left join program_remap pr on pr.old_program_id = pap.academic_program_id
group by pap.user_id, coalesce(pr.canonical_program_id, pap.academic_program_id);

create temp table program_expertise_rows as
select
  coalesce(pr.canonical_program_id, ape.academic_program_id) as academic_program_id,
  ape.expertise_id,
  min(ape.created_at) as created_at
from public.academic_program_expertise ape
left join program_remap pr on pr.old_program_id = ape.academic_program_id
group by coalesce(pr.canonical_program_id, ape.academic_program_id), ape.expertise_id;

update public.profiles p
set academic_program_id = pr.canonical_program_id,
    faculty_id = pr.canonical_faculty_id,
    updated_at = now()
from program_remap pr
where p.academic_program_id = pr.old_program_id;

delete from public.profile_academic_programs;

insert into public.profile_academic_programs (
  user_id,
  academic_program_id,
  is_primary,
  created_at
)
select
  user_id,
  academic_program_id,
  is_primary,
  created_at
from profile_program_rows
on conflict (user_id, academic_program_id) do update
set is_primary = public.profile_academic_programs.is_primary or excluded.is_primary;

delete from public.academic_program_expertise;

insert into public.academic_program_expertise (
  academic_program_id,
  expertise_id,
  created_at
)
select
  academic_program_id,
  expertise_id,
  created_at
from program_expertise_rows
on conflict (academic_program_id, expertise_id) do nothing;

update public.profiles p
set system_avatar_key = private.derive_system_avatar_key(
      p.faculty_id,
      p.academic_program_id
    ),
    updated_at = now()
where private.derive_system_avatar_key(p.faculty_id, p.academic_program_id) is not null;

update public.academic_programs
set is_active = false,
    updated_at = now()
where slug not in (select slug from canonical_programs);

update public.faculties
set is_active = false,
    updated_at = now()
where slug not in (select slug from canonical_faculties)
   or lower(slug) in ('kmbs', 'kyiv-mohyla-business-school')
   or display_name in (
      'Києво-Могилянська Бізнес-Школа (kmbs)',
      'Факультет «Києво-Могилянська школа професійної та неперервної освіти»',
      'Києво-Могилянська школа професійної та неперервної освіти'
    );

comment on table public.academic_programs is
  'Canonical Mohyla Match academic specialty taxonomy. Visible active rows are unique by approved faculty + specialty; study_level is retained only for backward-compatible storage.';

commit;
