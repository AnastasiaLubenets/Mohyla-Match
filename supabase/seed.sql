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
  ('technical', 'frontend-development', 'Frontend development', 10),
  ('technical', 'backend-development', 'Backend development', 20),
  ('technical', 'data-analysis', 'Data analysis', 30),
  ('technical', 'product-design', 'Product design', 40),
  ('technical', 'research-methods', 'Research methods', 50),
  ('creative', 'copywriting', 'Copywriting', 10),
  ('creative', 'visual-design', 'Visual design', 20),
  ('creative', 'presentation-design', 'Presentation design', 30),
  ('business', 'market-research', 'Market research', 10),
  ('business', 'financial-modeling', 'Financial modeling', 20),
  ('business', 'project-management', 'Project management', 30),
  ('communication', 'public-speaking', 'Public speaking', 10),
  ('communication', 'community-building', 'Community building', 20),
  ('communication', 'event-organization', 'Event organization', 30)
on conflict (slug) do update
set category = excluded.category,
    name = excluded.name,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

insert into public.interests (slug, name, sort_order)
values
  ('startups', 'Startups', 10),
  ('education', 'Education', 20),
  ('civic-tech', 'Civic tech', 30),
  ('culture', 'Culture', 40),
  ('media', 'Media', 50),
  ('science', 'Science', 60),
  ('sustainability', 'Sustainability', 70),
  ('career-growth', 'Career growth', 80),
  ('student-initiatives', 'Student initiatives', 90),
  ('volunteering', 'Volunteering', 100)
on conflict (slug) do update
set name = excluded.name,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

insert into public.collaboration_goals (slug, name, sort_order)
values
  ('build-project', 'Build a project', 10),
  ('join-team', 'Join a team', 20),
  ('find-cofounder', 'Find a cofounder', 30),
  ('study-together', 'Study together', 40),
  ('prepare-event', 'Prepare an event', 50),
  ('research-collaboration', 'Research collaboration', 60),
  ('portfolio-piece', 'Create a portfolio piece', 70),
  ('practice-skills', 'Practice skills', 80)
on conflict (slug) do update
set name = excluded.name,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

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
