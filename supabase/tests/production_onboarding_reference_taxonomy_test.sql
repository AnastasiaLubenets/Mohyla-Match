begin;

select plan(6);

select is(
  (
    select count(*)::integer
    from public.skills
    where is_active
  ),
  24,
  'all production onboarding skills are active'
);

select results_eq(
  $$
    select category, count(*)::integer
    from public.skills
    where is_active
    group by category
    order by category
  $$,
  $$
    values
      ('Design'::text, 3),
      ('Development'::text, 5),
      ('Finance'::text, 4),
      ('Management'::text, 2),
      ('Marketing'::text, 4),
      ('Media'::text, 3),
      ('Research'::text, 3)
  $$,
  'active skill counts match each production category'
);

select results_eq(
  $$
    select category, slug, name
    from public.skills
    where is_active
    order by category, sort_order, slug
  $$,
  $$
    values
      ('Design'::text, 'figma'::text, 'Figma'::text),
      ('Design'::text, 'ui-ux'::text, 'UI/UX'::text),
      ('Design'::text, 'graphic-design'::text, 'Graphic Design'::text),
      ('Development'::text, 'react'::text, 'React'::text),
      ('Development'::text, 'python'::text, 'Python'::text),
      ('Development'::text, 'java'::text, 'Java'::text),
      ('Development'::text, 'sql'::text, 'SQL'::text),
      ('Development'::text, 'ai-data'::text, 'AI/Data'::text),
      ('Finance'::text, 'excel'::text, 'Excel'::text),
      ('Finance'::text, 'financial-analysis'::text, 'Financial Analysis'::text),
      ('Finance'::text, 'accounting'::text, 'Accounting'::text),
      ('Finance'::text, 'investments'::text, 'Investments'::text),
      ('Management'::text, 'project-management'::text, 'Project Management'::text),
      ('Management'::text, 'event-management'::text, 'Event Management'::text),
      ('Marketing'::text, 'smm'::text, 'SMM'::text),
      ('Marketing'::text, 'branding'::text, 'Branding'::text),
      ('Marketing'::text, 'advertising'::text, 'Advertising'::text),
      ('Marketing'::text, 'copywriting'::text, 'Copywriting'::text),
      ('Media'::text, 'photography'::text, 'Photography'::text),
      ('Media'::text, 'video'::text, 'Video'::text),
      ('Media'::text, 'editing'::text, 'Editing'::text),
      ('Research'::text, 'statistics'::text, 'Statistics'::text),
      ('Research'::text, 'data-analysis'::text, 'Data Analysis'::text),
      ('Research'::text, 'academic-research'::text, 'Academic Research'::text)
  $$,
  'active production skills match the canonical taxonomy'
);

select results_eq(
  $$
    select slug, name
    from public.interests
    where is_active
    order by sort_order, slug
  $$,
  $$
    values
      ('startups'::text, 'Startups'::text),
      ('education'::text, 'Education'::text),
      ('technology'::text, 'Technology'::text),
      ('finance'::text, 'Finance'::text),
      ('culture'::text, 'Culture'::text),
      ('volunteering'::text, 'Volunteering'::text),
      ('research'::text, 'Research'::text),
      ('social-impact'::text, 'Social Impact'::text),
      ('media'::text, 'Media'::text),
      ('entrepreneurship'::text, 'Entrepreneurship'::text)
  $$,
  'active production interests match the canonical taxonomy'
);

select results_eq(
  $$
    select slug, name
    from public.collaboration_goals
    where is_active
    order by sort_order, slug
  $$,
  $$
    values
      ('project-teammate'::text, 'Project teammate'::text),
      ('startup-cofounder'::text, 'Startup / Co-founder'::text),
      ('study-partner'::text, 'Study partner'::text),
      ('research'::text, 'Research'::text),
      ('volunteering'::text, 'Volunteering'::text),
      ('event'::text, 'Event'::text),
      ('creative-project'::text, 'Creative project'::text),
      ('mentor-mentee'::text, 'Mentor / Mentee'::text)
  $$,
  'active production collaboration goals match the canonical taxonomy'
);

select is(
  (
    select count(*)::integer
    from public.skills
    where is_active
      and slug not in (
        'react',
        'python',
        'java',
        'sql',
        'ai-data',
        'figma',
        'ui-ux',
        'graphic-design',
        'excel',
        'financial-analysis',
        'accounting',
        'investments',
        'smm',
        'branding',
        'advertising',
        'copywriting',
        'statistics',
        'data-analysis',
        'academic-research',
        'photography',
        'video',
        'editing',
        'project-management',
        'event-management'
      )
  ) + (
    select count(*)::integer
    from public.interests
    where is_active
      and slug not in (
        'startups',
        'education',
        'technology',
        'finance',
        'culture',
        'volunteering',
        'research',
        'social-impact',
        'media',
        'entrepreneurship'
      )
  ) + (
    select count(*)::integer
    from public.collaboration_goals
    where is_active
      and slug not in (
        'project-teammate',
        'startup-cofounder',
        'study-partner',
        'research',
        'volunteering',
        'event',
        'creative-project',
        'mentor-mentee'
      )
  ),
  0,
  'only canonical onboarding reference rows are active'
);

select * from finish();

rollback;
