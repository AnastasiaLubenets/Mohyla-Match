-- Phase 2 seed/reference data for local development.
-- Faculty/program rows below are development reference taxonomy, not verified
-- production-canonical NaUKMA data. Replace them with confirmed taxonomy before
-- production launch. Do not seed guessed corporate email domains here.

begin;

insert into public.faculties (slug, display_name, avatar_theme_key, sort_order)
values
  ('development-humanities', 'Development Reference: Humanities', 'faculty-humanities', 10),
  ('development-social-sciences', 'Development Reference: Social Sciences', 'faculty-social-sciences', 20),
  ('development-economics', 'Development Reference: Economics', 'faculty-economics', 30),
  ('development-informatics', 'Development Reference: Informatics', 'faculty-informatics', 40),
  ('development-law', 'Development Reference: Law', 'faculty-law', 50),
  ('development-natural-sciences', 'Development Reference: Natural Sciences', 'faculty-natural-sciences', 60)
on conflict (slug) do update
set display_name = excluded.display_name,
    avatar_theme_key = excluded.avatar_theme_key,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

insert into public.academic_programs (faculty_id, slug, display_name, avatar_variant_key, sort_order)
values
  ((select id from public.faculties where slug = 'development-humanities'), 'development-literature', 'Development Reference: Literature', 'program-literature', 10),
  ((select id from public.faculties where slug = 'development-humanities'), 'development-history', 'Development Reference: History', 'program-history', 20),
  ((select id from public.faculties where slug = 'development-social-sciences'), 'development-sociology', 'Development Reference: Sociology', 'program-sociology', 10),
  ((select id from public.faculties where slug = 'development-social-sciences'), 'development-political-science', 'Development Reference: Political Science', 'program-political-science', 20),
  ((select id from public.faculties where slug = 'development-economics'), 'development-economics', 'Development Reference: Economics', 'program-economics', 10),
  ((select id from public.faculties where slug = 'development-economics'), 'development-marketing', 'Development Reference: Marketing', 'program-marketing', 20),
  ((select id from public.faculties where slug = 'development-informatics'), 'development-computer-science', 'Development Reference: Computer Science', 'program-computer-science', 10),
  ((select id from public.faculties where slug = 'development-informatics'), 'development-software-engineering', 'Development Reference: Software Engineering', 'program-software-engineering', 20),
  ((select id from public.faculties where slug = 'development-law'), 'development-law', 'Development Reference: Law', 'program-law', 10),
  ((select id from public.faculties where slug = 'development-natural-sciences'), 'development-biology', 'Development Reference: Biology', 'program-biology', 10),
  ((select id from public.faculties where slug = 'development-natural-sciences'), 'development-chemistry', 'Development Reference: Chemistry', 'program-chemistry', 20)
on conflict (slug) do update
set faculty_id = excluded.faculty_id,
    display_name = excluded.display_name,
    avatar_variant_key = excluded.avatar_variant_key,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

insert into public.skills (category, slug, name, sort_order)
values
  ('Development', 'react', 'React', 10),
  ('Development', 'python', 'Python', 20),
  ('Development', 'java', 'Java', 30),
  ('Development', 'sql', 'SQL', 40),
  ('Development', 'ai-data', 'AI/Data', 50),
  ('Design', 'figma', 'Figma', 10),
  ('Design', 'ui-ux', 'UI/UX', 20),
  ('Design', 'graphic-design', 'Graphic Design', 30),
  ('Finance', 'excel', 'Excel', 10),
  ('Finance', 'financial-analysis', 'Financial Analysis', 20),
  ('Finance', 'accounting', 'Accounting', 30),
  ('Finance', 'investments', 'Investments', 40),
  ('Marketing', 'smm', 'SMM', 10),
  ('Marketing', 'branding', 'Branding', 20),
  ('Marketing', 'advertising', 'Advertising', 30),
  ('Marketing', 'copywriting', 'Copywriting', 40),
  ('Research', 'statistics', 'Statistics', 10),
  ('Research', 'data-analysis', 'Data Analysis', 20),
  ('Research', 'academic-research', 'Academic Research', 30),
  ('Media', 'photography', 'Photography', 10),
  ('Media', 'video', 'Video', 20),
  ('Media', 'editing', 'Editing', 30),
  ('Management', 'project-management', 'Project Management', 10),
  ('Management', 'event-management', 'Event Management', 20)
on conflict (slug) do update
set category = excluded.category,
    name = excluded.name,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

update public.skills
set is_active = false,
    updated_at = now()
where slug not in (
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
);

insert into public.interests (slug, name, sort_order)
values
  ('startups', 'Startups', 10),
  ('education', 'Education', 20),
  ('technology', 'Technology', 30),
  ('finance', 'Finance', 40),
  ('culture', 'Culture', 50),
  ('volunteering', 'Volunteering', 60),
  ('research', 'Research', 70),
  ('social-impact', 'Social Impact', 80),
  ('media', 'Media', 90),
  ('entrepreneurship', 'Entrepreneurship', 100)
on conflict (slug) do update
set name = excluded.name,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

update public.interests
set is_active = false,
    updated_at = now()
where slug not in (
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
);

insert into public.collaboration_goals (slug, name, sort_order)
values
  ('project-teammate', 'Project teammate', 10),
  ('startup-cofounder', 'Startup / Co-founder', 20),
  ('study-partner', 'Study partner', 30),
  ('research', 'Research', 40),
  ('volunteering', 'Volunteering', 50),
  ('event', 'Event', 60),
  ('creative-project', 'Creative project', 70),
  ('mentor-mentee', 'Mentor / Mentee', 80)
on conflict (slug) do update
set name = excluded.name,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

update public.collaboration_goals
set is_active = false,
    updated_at = now()
where slug not in (
  'project-teammate',
  'startup-cofounder',
  'study-partner',
  'research',
  'volunteering',
  'event',
  'creative-project',
  'mentor-mentee'
);

insert into public.matching_config (
  version,
  is_active,
  my_looking_for_their_offer_weight,
  their_looking_for_my_offer_weight,
  common_interests_weight,
  collaboration_goals_weight,
  availability_weight
)
values (1, true, 35, 25, 15, 15, 10)
on conflict (version) do update
set is_active = excluded.is_active,
    my_looking_for_their_offer_weight = excluded.my_looking_for_their_offer_weight,
    their_looking_for_my_offer_weight = excluded.their_looking_for_my_offer_weight,
    common_interests_weight = excluded.common_interests_weight,
    collaboration_goals_weight = excluded.collaboration_goals_weight,
    availability_weight = excluded.availability_weight,
    updated_at = now();

commit;
