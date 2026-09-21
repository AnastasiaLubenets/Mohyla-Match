begin;

insert into public.skills (category, slug, name, is_active, sort_order)
values
  ('Development', 'react', 'React', true, 10),
  ('Development', 'python', 'Python', true, 20),
  ('Development', 'java', 'Java', true, 30),
  ('Development', 'sql', 'SQL', true, 40),
  ('Development', 'ai-data', 'AI/Data', true, 50),
  ('Design', 'figma', 'Figma', true, 10),
  ('Design', 'ui-ux', 'UI/UX', true, 20),
  ('Design', 'graphic-design', 'Graphic Design', true, 30),
  ('Finance', 'excel', 'Excel', true, 10),
  ('Finance', 'financial-analysis', 'Financial Analysis', true, 20),
  ('Finance', 'accounting', 'Accounting', true, 30),
  ('Finance', 'investments', 'Investments', true, 40),
  ('Marketing', 'smm', 'SMM', true, 10),
  ('Marketing', 'branding', 'Branding', true, 20),
  ('Marketing', 'advertising', 'Advertising', true, 30),
  ('Marketing', 'copywriting', 'Copywriting', true, 40),
  ('Research', 'statistics', 'Statistics', true, 10),
  ('Research', 'data-analysis', 'Data Analysis', true, 20),
  ('Research', 'academic-research', 'Academic Research', true, 30),
  ('Media', 'photography', 'Photography', true, 10),
  ('Media', 'video', 'Video', true, 20),
  ('Media', 'editing', 'Editing', true, 30),
  ('Management', 'project-management', 'Project Management', true, 10),
  ('Management', 'event-management', 'Event Management', true, 20)
on conflict (slug) do update
set category = excluded.category,
    name = excluded.name,
    is_active = excluded.is_active,
    sort_order = excluded.sort_order,
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

insert into public.interests (slug, name, is_active, sort_order)
values
  ('startups', 'Startups', true, 10),
  ('education', 'Education', true, 20),
  ('technology', 'Technology', true, 30),
  ('finance', 'Finance', true, 40),
  ('culture', 'Culture', true, 50),
  ('volunteering', 'Volunteering', true, 60),
  ('research', 'Research', true, 70),
  ('social-impact', 'Social Impact', true, 80),
  ('media', 'Media', true, 90),
  ('entrepreneurship', 'Entrepreneurship', true, 100)
on conflict (slug) do update
set name = excluded.name,
    is_active = excluded.is_active,
    sort_order = excluded.sort_order,
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

insert into public.collaboration_goals (slug, name, is_active, sort_order)
values
  ('project-teammate', 'Project teammate', true, 10),
  ('startup-cofounder', 'Startup / Co-founder', true, 20),
  ('study-partner', 'Study partner', true, 30),
  ('research', 'Research', true, 40),
  ('volunteering', 'Volunteering', true, 50),
  ('event', 'Event', true, 60),
  ('creative-project', 'Creative project', true, 70),
  ('mentor-mentee', 'Mentor / Mentee', true, 80)
on conflict (slug) do update
set name = excluded.name,
    is_active = excluded.is_active,
    sort_order = excluded.sort_order,
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

commit;
