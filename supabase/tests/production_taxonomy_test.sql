begin;

select plan(5);

select is(
  (
    select count(*)::integer
    from public.faculties
    where is_active
      and slug in (
        'kma-school-professional-continuing-education',
        'faculty-economics',
        'faculty-social-sciences-social-technologies',
        'faculty-law',
        'faculty-humanities',
        'faculty-international-relations-governance',
        'faculty-natural-sciences',
        'faculty-informatics',
        'faculty-health-social-work-psychology',
        'liberal-arts-studies-center'
      )
  ),
  10,
  'all production NaUKMA faculties are active'
);

select is(
  (
    select count(*)::integer
    from public.academic_programs ap
    join public.faculties f on f.id = ap.faculty_id
    where ap.is_active
      and f.slug in (
        'kma-school-professional-continuing-education',
        'faculty-economics',
        'faculty-social-sciences-social-technologies',
        'faculty-law',
        'faculty-humanities',
        'faculty-international-relations-governance',
        'faculty-natural-sciences',
        'faculty-informatics',
        'faculty-health-social-work-psychology',
        'liberal-arts-studies-center'
      )
  ),
  67,
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
      'kma-school-professional-continuing-education',
      'faculty-economics',
      'faculty-social-sciences-social-technologies',
      'faculty-law',
      'faculty-humanities',
      'faculty-international-relations-governance',
      'faculty-natural-sciences',
      'faculty-informatics',
      'faculty-health-social-work-psychology',
      'liberal-arts-studies-center'
    )
    group by f.slug
    order by f.slug
  $$,
  $$
    values
      ('faculty-economics'::text, 9),
      ('faculty-health-social-work-psychology'::text, 7),
      ('faculty-humanities'::text, 14),
      ('faculty-informatics'::text, 9),
      ('faculty-international-relations-governance'::text, 5),
      ('faculty-law'::text, 2),
      ('faculty-natural-sciences'::text, 8),
      ('faculty-social-sciences-social-technologies'::text, 8),
      ('kma-school-professional-continuing-education'::text, 4),
      ('liberal-arts-studies-center'::text, 1)
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
        'kma-school-professional-continuing-education',
        'faculty-economics',
        'faculty-social-sciences-social-technologies',
        'faculty-law',
        'faculty-humanities',
        'faculty-international-relations-governance',
        'faculty-natural-sciences',
        'faculty-informatics',
        'faculty-health-social-work-psychology',
        'liberal-arts-studies-center'
      )
    order by f.sort_order, ap.sort_order, ap.slug
  $$,
  $$
    values
      ('kma-school-professional-continuing-education'::text, 'political-leadership-economic-diplomacy'::text),
      ('kma-school-professional-continuing-education'::text, 'master-economic-diplomacy-gr-policies'::text),
      ('kma-school-professional-continuing-education'::text, 'master-city-governance-policy'::text),
      ('kma-school-professional-continuing-education'::text, 'master-education-management'::text),
      ('faculty-economics'::text, 'economics'::text),
      ('faculty-economics'::text, 'finance-banking-insurance'::text),
      ('faculty-economics'::text, 'management'::text),
      ('faculty-economics'::text, 'marketing'::text),
      ('faculty-economics'::text, 'master-economics'::text),
      ('faculty-economics'::text, 'master-international-business'::text),
      ('faculty-economics'::text, 'master-finance-banking-insurance'::text),
      ('faculty-economics'::text, 'master-business-development-management-consulting'::text),
      ('faculty-economics'::text, 'master-marketing'::text),
      ('faculty-social-sciences-social-technologies'::text, 'political-science'::text),
      ('faculty-social-sciences-social-technologies'::text, 'sociology'::text),
      ('faculty-social-sciences-social-technologies'::text, 'public-relations'::text),
      ('faculty-social-sciences-social-technologies'::text, 'master-anticorruption-studies'::text),
      ('faculty-social-sciences-social-technologies'::text, 'master-political-science'::text),
      ('faculty-social-sciences-social-technologies'::text, 'master-sociology'::text),
      ('faculty-social-sciences-social-technologies'::text, 'master-journalism'::text),
      ('faculty-social-sciences-social-technologies'::text, 'master-public-relations'::text),
      ('faculty-law'::text, 'law'::text),
      ('faculty-law'::text, 'master-law'::text),
      ('faculty-humanities'::text, 'history'::text),
      ('faculty-humanities'::text, 'archaeology'::text),
      ('faculty-humanities'::text, 'philosophy'::text),
      ('faculty-humanities'::text, 'english-and-ukrainian-language'::text),
      ('faculty-humanities'::text, 'language-literature-comparative-studies'::text),
      ('faculty-humanities'::text, 'cultural-studies'::text),
      ('faculty-humanities'::text, 'master-judaic-studies'::text),
      ('faculty-humanities'::text, 'master-history'::text),
      ('faculty-humanities'::text, 'master-archaeology'::text),
      ('faculty-humanities'::text, 'master-philosophy'::text),
      ('faculty-humanities'::text, 'master-ukrainian-comparative-psycholinguistics'::text),
      ('faculty-humanities'::text, 'master-english-ukrainian-languages-communication'::text),
      ('faculty-humanities'::text, 'master-literary-theory-history-comparative-studies'::text),
      ('faculty-humanities'::text, 'master-mohyla-cultural-studies'::text),
      ('faculty-international-relations-governance'::text, 'international-relations-public-communications-regional-studies'::text),
      ('faculty-international-relations-governance'::text, 'public-private-governance'::text),
      ('faculty-international-relations-governance'::text, 'master-international-relations-public-communications-regional-studies'::text),
      ('faculty-international-relations-governance'::text, 'master-russian-studies-international-security-challenges'::text),
      ('faculty-international-relations-governance'::text, 'master-public-policy-governance'::text),
      ('faculty-natural-sciences'::text, 'biology-biotechnology'::text),
      ('faculty-natural-sciences'::text, 'ecology'::text),
      ('faculty-natural-sciences'::text, 'chemistry'::text),
      ('faculty-natural-sciences'::text, 'rocket-aerospace-systems-physics'::text),
      ('faculty-natural-sciences'::text, 'master-molecular-biology'::text),
      ('faculty-natural-sciences'::text, 'master-ecology-environmental-protection'::text),
      ('faculty-natural-sciences'::text, 'master-chemistry'::text),
      ('faculty-natural-sciences'::text, 'master-physics-aerodynamic-systems-modeling'::text),
      ('faculty-informatics'::text, 'applied-mathematics'::text),
      ('faculty-informatics'::text, 'big-data-analytics'::text),
      ('faculty-informatics'::text, 'software-engineering'::text),
      ('faculty-informatics'::text, 'computer-science'::text),
      ('faculty-informatics'::text, 'information-systems-vulnerability-analysis'::text),
      ('faculty-informatics'::text, 'automation-computer-integrated-technologies-robotics'::text),
      ('faculty-informatics'::text, 'master-applied-mathematics'::text),
      ('faculty-informatics'::text, 'master-software-engineering'::text),
      ('faculty-informatics'::text, 'master-computer-science'::text),
      ('faculty-health-social-work-psychology'::text, 'psychology'::text),
      ('faculty-health-social-work-psychology'::text, 'social-work'::text),
      ('faculty-health-social-work-psychology'::text, 'medicine'::text),
      ('faculty-health-social-work-psychology'::text, 'master-healthcare-management'::text),
      ('faculty-health-social-work-psychology'::text, 'master-psychology'::text),
      ('faculty-health-social-work-psychology'::text, 'master-public-health'::text),
      ('faculty-health-social-work-psychology'::text, 'master-social-work'::text),
      ('liberal-arts-studies-center'::text, 'mohyla-trivium-liberal-arts-sciences'::text)
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
