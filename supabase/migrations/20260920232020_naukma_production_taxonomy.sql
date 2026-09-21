-- Replace local-development reference faculty/program taxonomy with the
-- production NaUKMA 2026 educational-program taxonomy used by Mohyla Match.
-- Existing development rows are kept for referential safety but deactivated.

begin;

with faculty_rows (slug, display_name, avatar_theme_key, sort_order) as (
  values
    ('faculty-economics', 'Факультет економічних наук', 'faculty-economics', 10),
    ('faculty-social-sciences-social-technologies', 'Факультет соціальних наук та соціальних технологій', 'faculty-social-sciences', 20),
    ('faculty-law', 'Факультет правничих наук', 'faculty-law', 30),
    ('faculty-humanities', 'Факультет гуманітарних наук', 'faculty-humanities', 40),
    ('faculty-international-relations-governance', 'Факультет міжнародних відносин та врядування', 'faculty-ir-governance', 50),
    ('faculty-natural-sciences', 'Факультет природничих наук', 'faculty-natural-sciences', 60),
    ('faculty-informatics', 'Факультет інформатики', 'faculty-informatics', 70),
    ('faculty-health-social-work-psychology', 'Факультет охорони здоров’я, соціальної роботи і психології', 'faculty-health-social-work-psychology', 80)
)
insert into public.faculties (slug, display_name, avatar_theme_key, sort_order, is_active)
select slug, display_name, avatar_theme_key, sort_order, true
from faculty_rows
on conflict (slug) do update
set display_name = excluded.display_name,
    avatar_theme_key = excluded.avatar_theme_key,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

with program_rows (faculty_slug, slug, display_name, avatar_variant_key, sort_order) as (
  values
    ('faculty-economics', 'economics', 'Економіка', 'program-economics', 10),
    ('faculty-economics', 'marketing', 'Маркетинг', 'program-marketing', 20),
    ('faculty-economics', 'management', 'Менеджмент', 'program-management', 30),
    ('faculty-economics', 'finance-banking-insurance', 'Фінанси, банківська справа та страхування', 'program-finance-banking-insurance', 40),
    ('faculty-social-sciences-social-technologies', 'public-relations', 'Зв’язки з громадськістю', 'program-public-relations', 10),
    ('faculty-social-sciences-social-technologies', 'political-science', 'Політологія', 'program-political-science', 20),
    ('faculty-social-sciences-social-technologies', 'sociology', 'Соціологія', 'program-sociology', 30),
    ('faculty-law', 'law', 'Право', 'program-law', 10),
    ('faculty-humanities', 'history', 'Історія', 'program-history', 10),
    ('faculty-humanities', 'archaeology', 'Археологія', 'program-archaeology', 20),
    ('faculty-humanities', 'english-and-ukrainian-language', 'Англійська мова та українська мова', 'program-english-and-ukrainian-language', 30),
    ('faculty-humanities', 'cultural-studies', 'Культурологія', 'program-cultural-studies', 40),
    ('faculty-humanities', 'language-literature-comparative-studies', 'Мова, література, компаративістика', 'program-language-literature-comparative-studies', 50),
    ('faculty-humanities', 'philosophy', 'Філософія', 'program-philosophy', 60),
    ('faculty-international-relations-governance', 'international-relations-public-communications-regional-studies', 'Міжнародні відносини, суспільні комунікації та регіональні студії', 'program-international-relations-public-communications-regional-studies', 10),
    ('faculty-international-relations-governance', 'public-private-governance', 'Суспільне і приватне врядування', 'program-public-private-governance', 20),
    ('faculty-natural-sciences', 'biology-biotechnology', 'Біологія та біотехнологія', 'program-biology-biotechnology', 10),
    ('faculty-natural-sciences', 'ecology', 'Екологія', 'program-ecology', 20),
    ('faculty-natural-sciences', 'rocket-aerospace-systems-physics', 'Фізика ракетних і аерокосмічних систем', 'program-rocket-aerospace-systems-physics', 30),
    ('faculty-natural-sciences', 'chemistry', 'Хімія', 'program-chemistry', 40),
    ('faculty-informatics', 'software-engineering', 'Інженерія програмного забезпечення', 'program-software-engineering', 10),
    ('faculty-informatics', 'automation-computer-integrated-technologies-robotics', 'Автоматизація, комп’ютерно-інтегровані технології та робототехніка', 'program-automation-computer-integrated-technologies-robotics', 20),
    ('faculty-informatics', 'information-systems-vulnerability-analysis', 'Аналіз вразливостей інформаційних систем', 'program-information-systems-vulnerability-analysis', 30),
    ('faculty-informatics', 'big-data-analytics', 'Аналітика великих даних', 'program-big-data-analytics', 40),
    ('faculty-informatics', 'computer-science', 'Комп’ютерні науки', 'program-computer-science', 50),
    ('faculty-informatics', 'applied-mathematics', 'Прикладна математика', 'program-applied-mathematics', 60),
    ('faculty-health-social-work-psychology', 'psychology', 'Психологія', 'program-psychology', 10),
    ('faculty-health-social-work-psychology', 'social-work', 'Соціальна робота', 'program-social-work', 20)
)
insert into public.academic_programs (
  faculty_id,
  slug,
  display_name,
  avatar_variant_key,
  sort_order,
  is_active
)
select
  f.id,
  pr.slug,
  pr.display_name,
  pr.avatar_variant_key,
  pr.sort_order,
  true
from program_rows pr
join public.faculties f on f.slug = pr.faculty_slug
on conflict (slug) do update
set faculty_id = excluded.faculty_id,
    display_name = excluded.display_name,
    avatar_variant_key = excluded.avatar_variant_key,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

update public.academic_programs
set is_active = false,
    updated_at = now()
where slug like 'development-%';

update public.faculties
set is_active = false,
    updated_at = now()
where slug like 'development-%';

commit;
