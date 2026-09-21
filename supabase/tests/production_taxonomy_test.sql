begin;

select plan(5);

select is(
  (
    select count(*)::integer
    from public.faculties
    where is_active
      and slug in (
        'faculty-economics',
        'faculty-social-sciences-social-technologies',
        'faculty-law',
        'faculty-humanities',
        'faculty-international-relations-governance',
        'faculty-natural-sciences',
        'faculty-informatics',
        'faculty-health-social-work-psychology'
      )
  ),
  8,
  'all production NaUKMA faculties are active'
);

select is(
  (
    select count(*)::integer
    from public.academic_programs ap
    join public.faculties f on f.id = ap.faculty_id
    where ap.is_active
      and f.slug in (
        'faculty-economics',
        'faculty-social-sciences-social-technologies',
        'faculty-law',
        'faculty-humanities',
        'faculty-international-relations-governance',
        'faculty-natural-sciences',
        'faculty-informatics',
        'faculty-health-social-work-psychology'
      )
  ),
  28,
  'all production NaUKMA academic programs are active'
);

select results_eq(
  $$
    select f.slug, count(ap.id)::integer
    from public.faculties f
    join public.academic_programs ap
      on ap.faculty_id = f.id
      and ap.is_active
    where f.slug in (
      'faculty-economics',
      'faculty-social-sciences-social-technologies',
      'faculty-law',
      'faculty-humanities',
      'faculty-international-relations-governance',
      'faculty-natural-sciences',
      'faculty-informatics',
      'faculty-health-social-work-psychology'
    )
    group by f.slug
    order by f.slug
  $$,
  $$
    values
      ('faculty-economics'::text, 4),
      ('faculty-health-social-work-psychology'::text, 2),
      ('faculty-humanities'::text, 6),
      ('faculty-informatics'::text, 6),
      ('faculty-international-relations-governance'::text, 2),
      ('faculty-law'::text, 1),
      ('faculty-natural-sciences'::text, 4),
      ('faculty-social-sciences-social-technologies'::text, 3)
  $$,
  'active program counts match each production faculty'
);

select results_eq(
  $$
    select f.slug, ap.slug
    from public.academic_programs ap
    join public.faculties f on f.id = ap.faculty_id
    where ap.is_active
      and f.slug in (
        'faculty-economics',
        'faculty-social-sciences-social-technologies',
        'faculty-law',
        'faculty-humanities',
        'faculty-international-relations-governance',
        'faculty-natural-sciences',
        'faculty-informatics',
        'faculty-health-social-work-psychology'
      )
    order by f.sort_order, ap.sort_order, ap.slug
  $$,
  $$
    values
      ('faculty-economics'::text, 'economics'::text),
      ('faculty-economics'::text, 'marketing'::text),
      ('faculty-economics'::text, 'management'::text),
      ('faculty-economics'::text, 'finance-banking-insurance'::text),
      ('faculty-social-sciences-social-technologies'::text, 'public-relations'::text),
      ('faculty-social-sciences-social-technologies'::text, 'political-science'::text),
      ('faculty-social-sciences-social-technologies'::text, 'sociology'::text),
      ('faculty-law'::text, 'law'::text),
      ('faculty-humanities'::text, 'history'::text),
      ('faculty-humanities'::text, 'archaeology'::text),
      ('faculty-humanities'::text, 'english-and-ukrainian-language'::text),
      ('faculty-humanities'::text, 'cultural-studies'::text),
      ('faculty-humanities'::text, 'language-literature-comparative-studies'::text),
      ('faculty-humanities'::text, 'philosophy'::text),
      ('faculty-international-relations-governance'::text, 'international-relations-public-communications-regional-studies'::text),
      ('faculty-international-relations-governance'::text, 'public-private-governance'::text),
      ('faculty-natural-sciences'::text, 'biology-biotechnology'::text),
      ('faculty-natural-sciences'::text, 'ecology'::text),
      ('faculty-natural-sciences'::text, 'rocket-aerospace-systems-physics'::text),
      ('faculty-natural-sciences'::text, 'chemistry'::text),
      ('faculty-informatics'::text, 'software-engineering'::text),
      ('faculty-informatics'::text, 'automation-computer-integrated-technologies-robotics'::text),
      ('faculty-informatics'::text, 'information-systems-vulnerability-analysis'::text),
      ('faculty-informatics'::text, 'big-data-analytics'::text),
      ('faculty-informatics'::text, 'computer-science'::text),
      ('faculty-informatics'::text, 'applied-mathematics'::text),
      ('faculty-health-social-work-psychology'::text, 'psychology'::text),
      ('faculty-health-social-work-psychology'::text, 'social-work'::text)
  $$,
  'production programs belong to their expected faculties'
);

select is(
  (
    select count(*)::integer
    from public.faculties
    where slug like 'development-%'
      and is_active
  ) + (
    select count(*)::integer
    from public.academic_programs
    where slug like 'development-%'
      and is_active
  ),
  0,
  'development-reference faculty and program rows are inactive'
);

select * from finish();

rollback;
