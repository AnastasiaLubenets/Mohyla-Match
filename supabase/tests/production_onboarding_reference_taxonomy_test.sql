begin;

select plan(9);

select has_column(
  'public',
  'skills',
  'is_featured',
  'skills support featured suggested items'
);

select has_column(
  'public',
  'skills',
  'search_aliases',
  'skills support search aliases'
);

select is(
  (
    select count(*)::integer
    from public.skills
    where is_active
  ),
  268,
  'expanded production skills are active'
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
      ('Business, Sales & Entrepreneurship'::text, 24),
      ('Data, AI & Analytics'::text, 29),
      ('Design'::text, 20),
      ('Finance & Economics'::text, 18),
      ('General'::text, 9),
      ('Languages & Writing'::text, 11),
      ('Law, Policy & International Relations'::text, 16),
      ('Marketing & Communications'::text, 21),
      ('Media & Creative'::text, 18),
      ('People, Education & Social'::text, 14),
      ('Product & Project'::text, 17),
      ('Research & Academia'::text, 15),
      ('Science & Engineering'::text, 18),
      ('Software & Web'::text, 38)
  $$,
  'active skills match the expanded category distribution'
);

select results_eq(
  $$
    select name
    from public.skills
    where is_active
      and is_featured
    order by sort_order
  $$,
  $$
    values
      ('React'::text),
      ('Python'::text),
      ('SQL'::text),
      ('Data Analysis'::text),
      ('Excel'::text),
      ('AI / LLMs'::text),
      ('Figma'::text),
      ('Project Management'::text),
      ('Entrepreneurship'::text),
      ('Financial Analysis'::text),
      ('Marketing Strategy'::text),
      ('SMM'::text),
      ('Copywriting'::text),
      ('Video Editing'::text),
      ('Public Speaking'::text),
      ('Research'::text)
  $$,
  'featured suggested skills match the curated default list'
);

select results_eq(
  $$
    select slug
    from public.skills
    where is_active
      and (
        (slug = 'project-management' and 'pm' = any(search_aliases))
        or (slug = 'ai-data' and 'llms' = any(search_aliases))
        or (slug = 'javascript' and 'js' = any(search_aliases))
      )
    order by slug
  $$,
  $$
    values
      ('ai-data'::text),
      ('javascript'::text),
      ('project-management'::text)
  $$,
  'search aliases cover important short queries'
);

select results_eq(
  $$
    select slug, name
    from public.interests
    where is_active
    order by sort_order
  $$,
  $$
    values
      ('startups'::text, 'Startups'::text),
      ('entrepreneurship'::text, 'Entrepreneurship'::text),
      ('artificial-intelligence'::text, 'Artificial Intelligence'::text),
      ('machine-learning'::text, 'Machine Learning'::text),
      ('data-analytics'::text, 'Data & Analytics'::text),
      ('fintech'::text, 'FinTech'::text),
      ('edtech'::text, 'EdTech'::text),
      ('healthtech'::text, 'HealthTech'::text),
      ('legaltech'::text, 'LegalTech'::text),
      ('civictech'::text, 'CivicTech'::text),
      ('govtech'::text, 'GovTech'::text),
      ('climatetech'::text, 'ClimateTech'::text),
      ('green-energy'::text, 'Green Energy'::text),
      ('energy'::text, 'Energy'::text),
      ('defensetech'::text, 'DefenseTech'::text),
      ('drones-robotics'::text, 'Drones & Robotics'::text),
      ('cybersecurity'::text, 'Cybersecurity'::text),
      ('saas'::text, 'SaaS'::text),
      ('mobile-apps'::text, 'Mobile Apps'::text),
      ('web-apps'::text, 'Web Apps'::text),
      ('ecommerce'::text, 'E-commerce'::text),
      ('marketplaces'::text, 'Marketplaces'::text),
      ('finance'::text, 'Finance'::text),
      ('investing'::text, 'Investing'::text),
      ('economics'::text, 'Economics'::text),
      ('marketing'::text, 'Marketing'::text),
      ('design'::text, 'Design'::text),
      ('media'::text, 'Media'::text),
      ('journalism'::text, 'Journalism'::text),
      ('creator-economy'::text, 'Creator Economy'::text),
      ('gaming'::text, 'Gaming'::text),
      ('ar-vr'::text, 'AR/VR'::text),
      ('education'::text, 'Education'::text),
      ('research'::text, 'Research'::text),
      ('science'::text, 'Science'::text),
      ('biotechnology'::text, 'Biotechnology'::text),
      ('healthcare'::text, 'Healthcare'::text),
      ('psychology'::text, 'Psychology'::text),
      ('international-relations'::text, 'International Relations'::text),
      ('public-policy'::text, 'Public Policy'::text),
      ('human-rights'::text, 'Human Rights'::text),
      ('social-impact'::text, 'Social Impact'::text),
      ('ngos'::text, 'NGOs'::text),
      ('volunteering'::text, 'Volunteering'::text),
      ('sustainability'::text, 'Sustainability'::text),
      ('culture'::text, 'Culture'::text),
      ('art'::text, 'Art'::text),
      ('music'::text, 'Music'::text),
      ('film-video'::text, 'Film & Video'::text),
      ('books-literature'::text, 'Books & Literature'::text),
      ('communities'::text, 'Communities'::text),
      ('events'::text, 'Events'::text),
      ('travel'::text, 'Travel'::text),
      ('sports'::text, 'Sports'::text),
      ('food'::text, 'Food'::text),
      ('fashion'::text, 'Fashion'::text),
      ('space-aerospace'::text, 'Space & Aerospace'::text)
  $$,
  'Step 4 interests match the expanded canonical list'
);

select results_eq(
  $$
    select slug, name
    from public.collaboration_goals
    where is_active
    order by sort_order
  $$,
  $$
    values
      ('build-startup'::text, 'Build a startup'::text),
      ('startup-cofounder'::text, 'Find a co-founder'::text),
      ('build-mvp'::text, 'Build an MVP'::text),
      ('build-app'::text, 'Build an app'::text),
      ('build-website'::text, 'Build a website'::text),
      ('launch-business'::text, 'Launch a business'::text),
      ('join-project-team'::text, 'Join a project team'::text),
      ('project-teammate'::text, 'Find a project teammate'::text),
      ('hackathon-team'::text, 'Hackathon team'::text),
      ('case-competition-team'::text, 'Case competition team'::text),
      ('study-partner'::text, 'Study together'::text),
      ('research'::text, 'Research together'::text),
      ('academic-paper'::text, 'Write an academic paper'::text),
      ('portfolio-project'::text, 'Build a portfolio project'::text),
      ('creative-project'::text, 'Create a design project'::text),
      ('media-project'::text, 'Create a media project'::text),
      ('create-content'::text, 'Create content together'::text),
      ('launch-podcast'::text, 'Launch a podcast'::text),
      ('event'::text, 'Organize an event'::text),
      ('student-community'::text, 'Build a student community'::text),
      ('start-club'::text, 'Start a club'::text),
      ('volunteering'::text, 'Launch a volunteering initiative'::text),
      ('ngo-social-project'::text, 'Build an NGO / social project'::text),
      ('apply-grant'::text, 'Apply for a grant'::text),
      ('validate-business-idea'::text, 'Validate a business idea'::text),
      ('startup-pitch'::text, 'Prepare a startup pitch'::text),
      ('mentor-mentee'::text, 'Find a mentor'::text),
      ('mentor-someone'::text, 'Mentor someone'::text),
      ('accountability-partner'::text, 'Find an accountability partner'::text),
      ('practice-language'::text, 'Practice a language'::text),
      ('network-meet-people'::text, 'Network and meet interesting people'::text),
      ('explore-ideas'::text, 'Explore ideas without a fixed project yet'::text)
  $$,
  'Step 4 collaboration goals match the expanded canonical list'
);

select is(
  (
    select count(*)::integer
    from public.skills
    where is_active
      and slug in (
        'ai-data',
        'project-management',
        'financial-analysis',
        'marketing-strategy',
        'public-speaking',
        'video-editing',
        'entrepreneurship'
      )
  ),
  7,
  'important migrated and newly expanded skills remain active'
);

select * from finish();

rollback;
