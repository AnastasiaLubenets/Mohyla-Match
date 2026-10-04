begin;

select plan(9);

create temp table expected_faculties (
  slug text primary key,
  display_name text not null,
  sort_order integer not null
) on commit drop;

insert into expected_faculties (slug, display_name, sort_order)
values
  ('faculty-humanities', 'Факультет гуманітарних наук', 10),
  ('faculty-economics', 'Факультет економічних наук', 20),
  ('faculty-social-sciences-social-technologies', 'Факультет соціальних наук та соціальних технологій', 30),
  ('faculty-informatics', 'Факультет інформатики', 40),
  ('faculty-law', 'Факультет правничих наук', 50),
  ('faculty-natural-sciences', 'Факультет природничих наук', 60),
  ('faculty-health-social-work-psychology', 'Факультет охорони здоров’я, соціальної роботи та психології', 70);

create temp table expected_programs (
  faculty_slug text not null,
  display_name text not null,
  sort_order integer not null
) on commit drop;

insert into expected_programs (faculty_slug, display_name, sort_order)
values
  ('faculty-humanities', 'Історія та археологія', 110),
  ('faculty-humanities', 'Філософія', 120),
  ('faculty-humanities', 'Культурологія', 130),
  ('faculty-humanities', 'Філологія', 140),
  ('faculty-economics', 'Економіка', 210),
  ('faculty-economics', 'Фінанси, банківська справа та страхування', 220),
  ('faculty-economics', 'Менеджмент', 230),
  ('faculty-economics', 'Маркетинг', 240),
  ('faculty-social-sciences-social-technologies', 'Політологія', 310),
  ('faculty-social-sciences-social-technologies', 'Соціологія', 320),
  ('faculty-social-sciences-social-technologies', 'Міжнародні відносини, суспільні комунікації та регіональні студії', 330),
  ('faculty-social-sciences-social-technologies', 'Журналістика', 340),
  ('faculty-social-sciences-social-technologies', 'Менеджмент', 350),
  ('faculty-informatics', 'Прикладна математика', 410),
  ('faculty-informatics', 'Інженерія програмного забезпечення', 420),
  ('faculty-informatics', 'Комп''ютерні науки', 430),
  ('faculty-informatics', 'Системний аналіз', 440),
  ('faculty-law', 'Право', 510),
  ('faculty-law', 'Публічне управління та адміністрування', 520),
  ('faculty-natural-sciences', 'Біологія', 610),
  ('faculty-natural-sciences', 'Екологія', 620),
  ('faculty-natural-sciences', 'Хімія', 630),
  ('faculty-natural-sciences', 'Фізика та астрономія', 640),
  ('faculty-health-social-work-psychology', 'Психологія', 710),
  ('faculty-health-social-work-psychology', 'Соціальна робота', 720),
  ('faculty-health-social-work-psychology', 'Громадське здоров''я', 730),
  ('faculty-health-social-work-psychology', 'Менеджмент в охороні здоров''я', 740),
  ('faculty-health-social-work-psychology', 'Медицина', 750);

select results_eq(
  $$
    select f.slug, f.display_name, f.sort_order
    from public.faculties f
    join expected_faculties ef on ef.slug = f.slug
    where f.is_active
    order by f.sort_order
  $$,
  $$
    select slug, display_name, sort_order
    from expected_faculties
    order by sort_order
  $$,
  'only the 7 approved production faculties are active and ordered'
);

select is(
  (
    select count(*)::integer
    from public.faculties
    where is_active
      and (
        slug in (
          'kma-school-professional-continuing-education',
          'faculty-international-relations-governance',
          'liberal-arts-studies-center',
          'kmbs',
          'kyiv-mohyla-business-school'
        )
        or display_name in (
          'Києво-Могилянська Бізнес-Школа (kmbs)',
          'Факультет «Києво-Могилянська школа професійної та неперервної освіти»',
          'Києво-Могилянська школа професійної та неперервної освіти'
        )
      )
  ),
  0,
  'excluded non-product academic units are not active/selectable'
);

select results_eq(
  $$
    select f.slug, ap.display_name, ap.sort_order
    from public.academic_programs ap
    join public.faculties f on f.id = ap.faculty_id
    join expected_faculties ef on ef.slug = f.slug
    where ap.is_active
    order by f.sort_order, ap.sort_order
  $$,
  $$
    select faculty_slug, display_name, sort_order
    from expected_programs
    order by (
      select ef.sort_order from expected_faculties ef where ef.slug = faculty_slug
    ), sort_order
  $$,
  'active production academic programs match the approved faculty-specialty mapping'
);

select is(
  (
    select count(*)::integer
    from public.academic_programs ap
    join public.faculties f on f.id = ap.faculty_id
    join expected_faculties ef on ef.slug = f.slug
    where ap.is_active
  ),
  28,
  'there are exactly 28 approved active faculty-specialty rows'
);

select is_empty(
  $$
    select f.slug, lower(trim(ap.display_name)), count(*)
    from public.academic_programs ap
    join public.faculties f on f.id = ap.faculty_id
    join expected_faculties ef on ef.slug = f.slug
    where ap.is_active
    group by f.slug, lower(trim(ap.display_name))
    having count(*) > 1
  $$,
  'there are no duplicate active specialties within the same faculty'
);

select results_eq(
  $$
    select ap.display_name
    from public.academic_programs ap
    join public.faculties f on f.id = ap.faculty_id
    where ap.is_active
      and f.slug = 'faculty-economics'
    order by ap.sort_order
  $$,
  $$
    values
      ('Економіка'::text),
      ('Фінанси, банківська справа та страхування'::text),
      ('Менеджмент'::text),
      ('Маркетинг'::text)
  $$,
  'Faculty of Economics exposes exactly the approved deduplicated programs'
);

select results_eq(
  $$
    select ap.display_name
    from public.academic_programs ap
    join public.faculties f on f.id = ap.faculty_id
    where ap.is_active
      and f.slug = 'faculty-informatics'
    order by ap.sort_order
  $$,
  $$
    values
      ('Прикладна математика'::text),
      ('Інженерія програмного забезпечення'::text),
      ('Комп''ютерні науки'::text),
      ('Системний аналіз'::text)
  $$,
  'Faculty of Informatics exposes exactly the approved deduplicated programs'
);

select is_empty(
  $$
    select ap.slug
    from public.academic_programs ap
    where ap.is_active
      and ap.slug in (
        'master-economics',
        'master-finance-banking-insurance',
        'master-marketing',
        'master-computer-science',
        'political-leadership-economic-diplomacy',
        'master-economic-diplomacy-gr-policies',
        'mohyla-trivium-liberal-arts-sciences',
        'public-private-governance'
      )
  $$,
  'legacy master/extra production program rows are not active'
);

select is_empty(
  $$
    select ape.academic_program_id
    from public.academic_program_expertise ape
    join public.academic_programs ap on ap.id = ape.academic_program_id
    where not ap.is_active
      and ap.slug not like 'phase%'
      and ap.slug not like 'development-%'
  $$,
  'academic program expertise mappings were remapped away from inactive duplicate rows'
);

select * from finish();

rollback;
