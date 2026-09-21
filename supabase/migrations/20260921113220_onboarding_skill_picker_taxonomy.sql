begin;

alter table public.skills
  add column if not exists is_featured boolean not null default false;

alter table public.skills
  add column if not exists search_aliases text[] not null default '{}'::text[];

alter table public.skills
  drop constraint if exists skills_name_length;

alter table public.skills
  add constraint skills_name_length check (char_length(name) between 1 and 120);

create index if not exists skills_active_featured_sort_idx
  on public.skills (is_active, is_featured, sort_order);

create index if not exists skills_search_aliases_idx
  on public.skills using gin (search_aliases);

create temp table canonical_skills (
  category text not null,
  slug text not null primary key,
  name text not null,
  is_featured boolean not null,
  search_aliases text[] not null,
  sort_order integer not null
) on commit drop;

insert into canonical_skills (category, slug, name, is_featured, search_aliases, sort_order)
select
  raw.value->>'category',
  raw.value->>'slug',
  raw.value->>'name',
  coalesce((raw.value->>'is_featured')::boolean, false),
  array(
    select jsonb_array_elements_text(coalesce(raw.value->'search_aliases', '[]'::jsonb))
  ),
  (raw.position::integer * 10)
from jsonb_array_elements(
  $json$
  [
    {"category":"Software & Web","slug":"javascript","name":"JavaScript","search_aliases":["js","ecmascript"]},
    {"category":"Software & Web","slug":"typescript","name":"TypeScript","search_aliases":["ts"]},
    {"category":"Software & Web","slug":"react","name":"React","is_featured":true,"search_aliases":["reactjs","jsx"]},
    {"category":"Software & Web","slug":"next-js","name":"Next.js","search_aliases":["nextjs","next"]},
    {"category":"Software & Web","slug":"vue-js","name":"Vue.js","search_aliases":["vue"]},
    {"category":"Software & Web","slug":"angular","name":"Angular"},
    {"category":"Software & Web","slug":"node-js","name":"Node.js","search_aliases":["node","backend"]},
    {"category":"Software & Web","slug":"html-css","name":"HTML/CSS","search_aliases":["html","css","frontend"]},
    {"category":"Software & Web","slug":"tailwind-css","name":"Tailwind CSS","search_aliases":["tailwind"]},
    {"category":"Software & Web","slug":"rest-api","name":"REST API","search_aliases":["rest","api"]},
    {"category":"Software & Web","slug":"graphql","name":"GraphQL"},
    {"category":"Software & Web","slug":"git","name":"Git","search_aliases":["version control"]},
    {"category":"Software & Web","slug":"github","name":"GitHub"},
    {"category":"Software & Web","slug":"postgresql","name":"PostgreSQL","search_aliases":["postgres","database"]},
    {"category":"Software & Web","slug":"supabase","name":"Supabase"},
    {"category":"Software & Web","slug":"firebase","name":"Firebase"},
    {"category":"Software & Web","slug":"mongodb","name":"MongoDB","search_aliases":["mongo"]},
    {"category":"Software & Web","slug":"docker","name":"Docker","search_aliases":["containers"]},
    {"category":"Software & Web","slug":"linux","name":"Linux"},
    {"category":"Software & Web","slug":"testing","name":"Testing","search_aliases":["qa","quality assurance"]},
    {"category":"Software & Web","slug":"playwright","name":"Playwright","search_aliases":["e2e"]},
    {"category":"Software & Web","slug":"cypress","name":"Cypress","search_aliases":["e2e"]},
    {"category":"Software & Web","slug":"java","name":"Java"},
    {"category":"Software & Web","slug":"c-sharp","name":"C#","search_aliases":["csharp",".net","dotnet"]},
    {"category":"Software & Web","slug":"c","name":"C"},
    {"category":"Software & Web","slug":"cpp","name":"C++","search_aliases":["cplusplus"]},
    {"category":"Software & Web","slug":"python","name":"Python","is_featured":true,"search_aliases":["py"]},
    {"category":"Software & Web","slug":"go","name":"Go","search_aliases":["golang"]},
    {"category":"Software & Web","slug":"rust","name":"Rust"},
    {"category":"Software & Web","slug":"php","name":"PHP"},
    {"category":"Software & Web","slug":"kotlin","name":"Kotlin"},
    {"category":"Software & Web","slug":"swift","name":"Swift"},
    {"category":"Software & Web","slug":"android-development","name":"Android Development","search_aliases":["android"]},
    {"category":"Software & Web","slug":"ios-development","name":"iOS Development","search_aliases":["ios","iphone"]},
    {"category":"Software & Web","slug":"wordpress","name":"WordPress"},
    {"category":"Software & Web","slug":"webflow","name":"Webflow"},
    {"category":"Software & Web","slug":"no-code-development","name":"No-code Development","search_aliases":["nocode","no code"]},
    {"category":"Software & Web","slug":"api-integration","name":"API Integration","search_aliases":["integrations"]},

    {"category":"Data, AI & Analytics","slug":"sql","name":"SQL","is_featured":true,"search_aliases":["database","queries"]},
    {"category":"Data, AI & Analytics","slug":"python-data-analysis","name":"Python for Data Analysis","search_aliases":["python data","pandas"]},
    {"category":"Data, AI & Analytics","slug":"pandas","name":"Pandas"},
    {"category":"Data, AI & Analytics","slug":"numpy","name":"NumPy"},
    {"category":"Data, AI & Analytics","slug":"r","name":"R","search_aliases":["r language"]},
    {"category":"Data, AI & Analytics","slug":"data-analysis","name":"Data Analysis","is_featured":true,"search_aliases":["analytics"]},
    {"category":"Data, AI & Analytics","slug":"data-cleaning","name":"Data Cleaning","search_aliases":["etl"]},
    {"category":"Data, AI & Analytics","slug":"data-visualization","name":"Data Visualization","search_aliases":["dataviz","charts"]},
    {"category":"Data, AI & Analytics","slug":"power-bi","name":"Power BI","search_aliases":["powerbi","bi"]},
    {"category":"Data, AI & Analytics","slug":"tableau","name":"Tableau","search_aliases":["bi"]},
    {"category":"Data, AI & Analytics","slug":"looker-studio","name":"Looker Studio","search_aliases":["google data studio","bi"]},
    {"category":"Data, AI & Analytics","slug":"excel","name":"Excel","is_featured":true,"search_aliases":["spreadsheets","xlsx"]},
    {"category":"Data, AI & Analytics","slug":"google-sheets","name":"Google Sheets","search_aliases":["sheets","spreadsheets"]},
    {"category":"Data, AI & Analytics","slug":"statistics","name":"Statistics","search_aliases":["stats"]},
    {"category":"Data, AI & Analytics","slug":"econometrics","name":"Econometrics"},
    {"category":"Data, AI & Analytics","slug":"machine-learning","name":"Machine Learning","search_aliases":["ml"]},
    {"category":"Data, AI & Analytics","slug":"deep-learning","name":"Deep Learning","search_aliases":["dl"]},
    {"category":"Data, AI & Analytics","slug":"natural-language-processing","name":"Natural Language Processing","search_aliases":["nlp"]},
    {"category":"Data, AI & Analytics","slug":"computer-vision","name":"Computer Vision","search_aliases":["cv"]},
    {"category":"Data, AI & Analytics","slug":"generative-ai","name":"Generative AI","search_aliases":["gen ai","genai"]},
    {"category":"Data, AI & Analytics","slug":"ai-data","name":"AI / LLMs","is_featured":true,"search_aliases":["ai","artificial intelligence","llm","llms","chatgpt","gpt"]},
    {"category":"Data, AI & Analytics","slug":"prompt-engineering","name":"Prompt Engineering","search_aliases":["prompts"]},
    {"category":"Data, AI & Analytics","slug":"ai-automation","name":"AI Automation","search_aliases":["automation"]},
    {"category":"Data, AI & Analytics","slug":"web-scraping","name":"Web Scraping","search_aliases":["scraping","parsing"]},
    {"category":"Data, AI & Analytics","slug":"ab-testing","name":"A/B Testing","search_aliases":["experimentation"]},
    {"category":"Data, AI & Analytics","slug":"forecasting","name":"Forecasting"},
    {"category":"Data, AI & Analytics","slug":"big-data","name":"Big Data"},
    {"category":"Data, AI & Analytics","slug":"data-engineering","name":"Data Engineering"},
    {"category":"Data, AI & Analytics","slug":"database-design","name":"Database Design"},

    {"category":"Design","slug":"figma","name":"Figma","is_featured":true,"search_aliases":["figjam"]},
    {"category":"Design","slug":"ui-design","name":"UI Design","search_aliases":["interface design"]},
    {"category":"Design","slug":"ux-design","name":"UX Design","search_aliases":["experience design"]},
    {"category":"Design","slug":"ui-ux","name":"UI/UX","search_aliases":["ui ux","product interface"]},
    {"category":"Design","slug":"ux-research","name":"UX Research","search_aliases":["user research"]},
    {"category":"Design","slug":"product-design","name":"Product Design"},
    {"category":"Design","slug":"wireframing","name":"Wireframing"},
    {"category":"Design","slug":"prototyping","name":"Prototyping"},
    {"category":"Design","slug":"design-systems","name":"Design Systems"},
    {"category":"Design","slug":"graphic-design","name":"Graphic Design"},
    {"category":"Design","slug":"branding","name":"Branding"},
    {"category":"Design","slug":"logo-design","name":"Logo Design"},
    {"category":"Design","slug":"illustration","name":"Illustration"},
    {"category":"Design","slug":"motion-design","name":"Motion Design"},
    {"category":"Design","slug":"3d-design","name":"3D Design","search_aliases":["3d"]},
    {"category":"Design","slug":"blender","name":"Blender"},
    {"category":"Design","slug":"photoshop","name":"Photoshop","search_aliases":["adobe photoshop"]},
    {"category":"Design","slug":"illustrator","name":"Illustrator","search_aliases":["adobe illustrator"]},
    {"category":"Design","slug":"canva","name":"Canva"},
    {"category":"Design","slug":"presentation-design","name":"Presentation Design","search_aliases":["slides","deck"]},

    {"category":"Product & Project","slug":"product-management","name":"Product Management","search_aliases":["pm product"]},
    {"category":"Product & Project","slug":"project-management","name":"Project Management","is_featured":true,"search_aliases":["pm","project manager"]},
    {"category":"Product & Project","slug":"agile","name":"Agile"},
    {"category":"Product & Project","slug":"scrum","name":"Scrum"},
    {"category":"Product & Project","slug":"product-strategy","name":"Product Strategy"},
    {"category":"Product & Project","slug":"roadmapping","name":"Roadmapping","search_aliases":["roadmap"]},
    {"category":"Product & Project","slug":"product-analytics","name":"Product Analytics"},
    {"category":"Product & Project","slug":"user-research","name":"User Research"},
    {"category":"Product & Project","slug":"customer-development","name":"Customer Development","search_aliases":["custdev"]},
    {"category":"Product & Project","slug":"business-analysis","name":"Business Analysis","search_aliases":["ba"]},
    {"category":"Product & Project","slug":"requirements-writing","name":"Requirements Writing"},
    {"category":"Product & Project","slug":"process-mapping","name":"Process Mapping"},
    {"category":"Product & Project","slug":"notion","name":"Notion"},
    {"category":"Product & Project","slug":"jira","name":"Jira"},
    {"category":"Product & Project","slug":"trello","name":"Trello"},
    {"category":"Product & Project","slug":"team-leadership","name":"Team Leadership"},
    {"category":"Product & Project","slug":"operations-management","name":"Operations Management"},

    {"category":"Business, Sales & Entrepreneurship","slug":"entrepreneurship","name":"Entrepreneurship","is_featured":true,"search_aliases":["startup","founder"]},
    {"category":"Business, Sales & Entrepreneurship","slug":"startup-strategy","name":"Startup Strategy","search_aliases":["startup"]},
    {"category":"Business, Sales & Entrepreneurship","slug":"business-strategy","name":"Business Strategy"},
    {"category":"Business, Sales & Entrepreneurship","slug":"business-model-design","name":"Business Model Design"},
    {"category":"Business, Sales & Entrepreneurship","slug":"market-research","name":"Market Research"},
    {"category":"Business, Sales & Entrepreneurship","slug":"competitor-analysis","name":"Competitor Analysis"},
    {"category":"Business, Sales & Entrepreneurship","slug":"sales","name":"Sales"},
    {"category":"Business, Sales & Entrepreneurship","slug":"b2b-sales","name":"B2B Sales"},
    {"category":"Business, Sales & Entrepreneurship","slug":"b2c-sales","name":"B2C Sales"},
    {"category":"Business, Sales & Entrepreneurship","slug":"lead-generation","name":"Lead Generation","search_aliases":["leads"]},
    {"category":"Business, Sales & Entrepreneurship","slug":"business-development","name":"Business Development","search_aliases":["bizdev"]},
    {"category":"Business, Sales & Entrepreneurship","slug":"crm","name":"CRM"},
    {"category":"Business, Sales & Entrepreneurship","slug":"hubspot","name":"HubSpot"},
    {"category":"Business, Sales & Entrepreneurship","slug":"salesforce","name":"Salesforce"},
    {"category":"Business, Sales & Entrepreneurship","slug":"cold-outreach","name":"Cold Outreach"},
    {"category":"Business, Sales & Entrepreneurship","slug":"negotiation","name":"Negotiation"},
    {"category":"Business, Sales & Entrepreneurship","slug":"partnerships","name":"Partnerships"},
    {"category":"Business, Sales & Entrepreneurship","slug":"customer-success","name":"Customer Success","search_aliases":["cs"]},
    {"category":"Business, Sales & Entrepreneurship","slug":"ecommerce","name":"E-commerce","search_aliases":["e commerce"]},
    {"category":"Business, Sales & Entrepreneurship","slug":"marketplace-operations","name":"Marketplace Operations"},
    {"category":"Business, Sales & Entrepreneurship","slug":"procurement","name":"Procurement"},
    {"category":"Business, Sales & Entrepreneurship","slug":"logistics","name":"Logistics"},
    {"category":"Business, Sales & Entrepreneurship","slug":"supply-chain","name":"Supply Chain"},
    {"category":"Business, Sales & Entrepreneurship","slug":"operations","name":"Operations"},

    {"category":"Finance & Economics","slug":"financial-analysis","name":"Financial Analysis","is_featured":true,"search_aliases":["finance analysis"]},
    {"category":"Finance & Economics","slug":"financial-modeling","name":"Financial Modeling"},
    {"category":"Finance & Economics","slug":"corporate-finance","name":"Corporate Finance"},
    {"category":"Finance & Economics","slug":"accounting","name":"Accounting"},
    {"category":"Finance & Economics","slug":"management-accounting","name":"Management Accounting"},
    {"category":"Finance & Economics","slug":"budgeting","name":"Budgeting"},
    {"category":"Finance & Economics","slug":"investments","name":"Investments","search_aliases":["investing"]},
    {"category":"Finance & Economics","slug":"investment-analysis","name":"Investment Analysis"},
    {"category":"Finance & Economics","slug":"valuation","name":"Valuation"},
    {"category":"Finance & Economics","slug":"portfolio-analysis","name":"Portfolio Analysis"},
    {"category":"Finance & Economics","slug":"banking","name":"Banking"},
    {"category":"Finance & Economics","slug":"fintech","name":"FinTech"},
    {"category":"Finance & Economics","slug":"economics","name":"Economics"},
    {"category":"Finance & Economics","slug":"microeconomics","name":"Microeconomics"},
    {"category":"Finance & Economics","slug":"macroeconomics","name":"Macroeconomics"},
    {"category":"Finance & Economics","slug":"economic-research","name":"Economic Research"},
    {"category":"Finance & Economics","slug":"risk-analysis","name":"Risk Analysis"},
    {"category":"Finance & Economics","slug":"excel-for-finance","name":"Excel for Finance"},

    {"category":"Marketing & Communications","slug":"marketing-strategy","name":"Marketing Strategy","is_featured":true,"search_aliases":["growth strategy"]},
    {"category":"Marketing & Communications","slug":"digital-marketing","name":"Digital Marketing"},
    {"category":"Marketing & Communications","slug":"smm","name":"SMM","is_featured":true,"search_aliases":["social media marketing","social media"]},
    {"category":"Marketing & Communications","slug":"content-marketing","name":"Content Marketing"},
    {"category":"Marketing & Communications","slug":"performance-marketing","name":"Performance Marketing"},
    {"category":"Marketing & Communications","slug":"meta-ads","name":"Meta Ads","search_aliases":["facebook ads","instagram ads"]},
    {"category":"Marketing & Communications","slug":"google-ads","name":"Google Ads","search_aliases":["ppc"]},
    {"category":"Marketing & Communications","slug":"seo","name":"SEO","search_aliases":["search engine optimization"]},
    {"category":"Marketing & Communications","slug":"sem","name":"SEM","search_aliases":["search engine marketing"]},
    {"category":"Marketing & Communications","slug":"email-marketing","name":"Email Marketing","search_aliases":["newsletter"]},
    {"category":"Marketing & Communications","slug":"copywriting","name":"Copywriting","is_featured":true,"search_aliases":["copy"]},
    {"category":"Marketing & Communications","slug":"content-writing","name":"Content Writing"},
    {"category":"Marketing & Communications","slug":"brand-strategy","name":"Brand Strategy"},
    {"category":"Marketing & Communications","slug":"pr","name":"PR","search_aliases":["public relations"]},
    {"category":"Marketing & Communications","slug":"communications","name":"Communications"},
    {"category":"Marketing & Communications","slug":"community-management","name":"Community Management"},
    {"category":"Marketing & Communications","slug":"influencer-marketing","name":"Influencer Marketing"},
    {"category":"Marketing & Communications","slug":"marketing-analytics","name":"Marketing Analytics"},
    {"category":"Marketing & Communications","slug":"event-marketing","name":"Event Marketing"},
    {"category":"Marketing & Communications","slug":"media-planning","name":"Media Planning"},
    {"category":"Marketing & Communications","slug":"advertising","name":"Advertising"},

    {"category":"Research & Academia","slug":"academic-research","name":"Academic Research"},
    {"category":"Research & Academia","slug":"literature-review","name":"Literature Review"},
    {"category":"Research & Academia","slug":"qualitative-research","name":"Qualitative Research"},
    {"category":"Research & Academia","slug":"quantitative-research","name":"Quantitative Research"},
    {"category":"Research & Academia","slug":"research-design","name":"Research Design"},
    {"category":"Research & Academia","slug":"survey-design","name":"Survey Design"},
    {"category":"Research & Academia","slug":"interview-research","name":"Interview Research"},
    {"category":"Research & Academia","slug":"statistical-analysis","name":"Statistical Analysis"},
    {"category":"Research & Academia","slug":"spss","name":"SPSS"},
    {"category":"Research & Academia","slug":"stata","name":"Stata"},
    {"category":"Research & Academia","slug":"academic-writing","name":"Academic Writing"},
    {"category":"Research & Academia","slug":"citation-management","name":"Citation Management"},
    {"category":"Research & Academia","slug":"policy-research","name":"Policy Research"},
    {"category":"Research & Academia","slug":"grant-writing","name":"Grant Writing"},
    {"category":"Research & Academia","slug":"scientific-presentation","name":"Scientific Presentation"},

    {"category":"Media & Creative","slug":"photography","name":"Photography"},
    {"category":"Media & Creative","slug":"video","name":"Videography","search_aliases":["video"]},
    {"category":"Media & Creative","slug":"video-editing","name":"Video Editing","is_featured":true,"search_aliases":["editing","video production"]},
    {"category":"Media & Creative","slug":"adobe-premiere-pro","name":"Adobe Premiere Pro","search_aliases":["premiere"]},
    {"category":"Media & Creative","slug":"after-effects","name":"After Effects","search_aliases":["ae"]},
    {"category":"Media & Creative","slug":"davinci-resolve","name":"DaVinci Resolve","search_aliases":["resolve"]},
    {"category":"Media & Creative","slug":"motion-graphics","name":"Motion Graphics"},
    {"category":"Media & Creative","slug":"scriptwriting","name":"Scriptwriting"},
    {"category":"Media & Creative","slug":"storytelling","name":"Storytelling"},
    {"category":"Media & Creative","slug":"journalism","name":"Journalism"},
    {"category":"Media & Creative","slug":"podcasting","name":"Podcasting"},
    {"category":"Media & Creative","slug":"audio-editing","name":"Audio Editing"},
    {"category":"Media & Creative","slug":"music-production","name":"Music Production"},
    {"category":"Media & Creative","slug":"creative-writing","name":"Creative Writing"},
    {"category":"Media & Creative","slug":"blogging","name":"Blogging"},
    {"category":"Media & Creative","slug":"social-media-content","name":"Social Media Content"},
    {"category":"Media & Creative","slug":"public-speaking","name":"Public Speaking","is_featured":true,"search_aliases":["speaking","presentation"]},
    {"category":"Media & Creative","slug":"presentation-skills","name":"Presentation Skills"},

    {"category":"Law, Policy & International Relations","slug":"legal-research","name":"Legal Research"},
    {"category":"Law, Policy & International Relations","slug":"legal-writing","name":"Legal Writing"},
    {"category":"Law, Policy & International Relations","slug":"contract-drafting","name":"Contract Drafting"},
    {"category":"Law, Policy & International Relations","slug":"contract-analysis","name":"Contract Analysis"},
    {"category":"Law, Policy & International Relations","slug":"compliance","name":"Compliance"},
    {"category":"Law, Policy & International Relations","slug":"data-protection","name":"Data Protection","search_aliases":["privacy","gdpr"]},
    {"category":"Law, Policy & International Relations","slug":"public-policy","name":"Public Policy"},
    {"category":"Law, Policy & International Relations","slug":"policy-analysis","name":"Policy Analysis"},
    {"category":"Law, Policy & International Relations","slug":"public-administration","name":"Public Administration"},
    {"category":"Law, Policy & International Relations","slug":"international-relations","name":"International Relations","search_aliases":["ir"]},
    {"category":"Law, Policy & International Relations","slug":"diplomacy","name":"Diplomacy"},
    {"category":"Law, Policy & International Relations","slug":"political-analysis","name":"Political Analysis"},
    {"category":"Law, Policy & International Relations","slug":"advocacy","name":"Advocacy"},
    {"category":"Law, Policy & International Relations","slug":"human-rights","name":"Human Rights"},
    {"category":"Law, Policy & International Relations","slug":"debate","name":"Debate"},
    {"category":"Law, Policy & International Relations","slug":"government-relations","name":"Government Relations"},

    {"category":"Science & Engineering","slug":"biology","name":"Biology"},
    {"category":"Science & Engineering","slug":"biotechnology","name":"Biotechnology"},
    {"category":"Science & Engineering","slug":"laboratory-research","name":"Laboratory Research","search_aliases":["lab research"]},
    {"category":"Science & Engineering","slug":"chemistry","name":"Chemistry"},
    {"category":"Science & Engineering","slug":"ecology","name":"Ecology"},
    {"category":"Science & Engineering","slug":"environmental-research","name":"Environmental Research"},
    {"category":"Science & Engineering","slug":"physics","name":"Physics"},
    {"category":"Science & Engineering","slug":"applied-mathematics","name":"Applied Mathematics"},
    {"category":"Science & Engineering","slug":"mathematical-modeling","name":"Mathematical Modeling"},
    {"category":"Science & Engineering","slug":"matlab","name":"MATLAB"},
    {"category":"Science & Engineering","slug":"gis","name":"GIS","search_aliases":["geographic information systems"]},
    {"category":"Science & Engineering","slug":"electronics","name":"Electronics"},
    {"category":"Science & Engineering","slug":"arduino","name":"Arduino"},
    {"category":"Science & Engineering","slug":"robotics","name":"Robotics"},
    {"category":"Science & Engineering","slug":"cad","name":"CAD"},
    {"category":"Science & Engineering","slug":"3d-printing","name":"3D Printing"},
    {"category":"Science & Engineering","slug":"aerospace","name":"Aerospace"},
    {"category":"Science & Engineering","slug":"engineering-research","name":"Engineering Research"},

    {"category":"People, Education & Social","slug":"psychology","name":"Psychology"},
    {"category":"People, Education & Social","slug":"social-work","name":"Social Work"},
    {"category":"People, Education & Social","slug":"teaching","name":"Teaching"},
    {"category":"People, Education & Social","slug":"tutoring","name":"Tutoring"},
    {"category":"People, Education & Social","slug":"mentoring","name":"Mentoring"},
    {"category":"People, Education & Social","slug":"coaching","name":"Coaching"},
    {"category":"People, Education & Social","slug":"facilitation","name":"Facilitation"},
    {"category":"People, Education & Social","slug":"recruiting","name":"Recruiting"},
    {"category":"People, Education & Social","slug":"hr","name":"HR","search_aliases":["human resources"]},
    {"category":"People, Education & Social","slug":"interviewing","name":"Interviewing"},
    {"category":"People, Education & Social","slug":"conflict-resolution","name":"Conflict Resolution"},
    {"category":"People, Education & Social","slug":"community-building","name":"Community Building"},
    {"category":"People, Education & Social","slug":"volunteer-management","name":"Volunteer Management"},
    {"category":"People, Education & Social","slug":"event-management","name":"Event Organization","search_aliases":["event management"]},

    {"category":"Languages & Writing","slug":"ukrainian","name":"Ukrainian"},
    {"category":"Languages & Writing","slug":"english","name":"English"},
    {"category":"Languages & Writing","slug":"german","name":"German"},
    {"category":"Languages & Writing","slug":"polish","name":"Polish"},
    {"category":"Languages & Writing","slug":"french","name":"French"},
    {"category":"Languages & Writing","slug":"spanish","name":"Spanish"},
    {"category":"Languages & Writing","slug":"translation","name":"Translation"},
    {"category":"Languages & Writing","slug":"editing","name":"Editing"},
    {"category":"Languages & Writing","slug":"proofreading","name":"Proofreading"},
    {"category":"Languages & Writing","slug":"technical-writing","name":"Technical Writing"},
    {"category":"Languages & Writing","slug":"business-writing","name":"Business Writing"},

    {"category":"General","slug":"leadership","name":"Leadership"},
    {"category":"General","slug":"teamwork","name":"Teamwork"},
    {"category":"General","slug":"problem-solving","name":"Problem Solving"},
    {"category":"General","slug":"critical-thinking","name":"Critical Thinking"},
    {"category":"General","slug":"research","name":"Research","is_featured":true},
    {"category":"General","slug":"organization","name":"Organization"},
    {"category":"General","slug":"time-management","name":"Time Management"},
    {"category":"General","slug":"networking","name":"Networking"},
    {"category":"General","slug":"communication","name":"Communication"}
  ]
  $json$::jsonb
) with ordinality as raw(value, position);

insert into public.skills (category, slug, name, is_active, is_featured, search_aliases, sort_order)
select category, slug, name, true, is_featured, search_aliases, sort_order
from canonical_skills
on conflict (slug) do update
set category = excluded.category,
    name = excluded.name,
    is_active = excluded.is_active,
    is_featured = excluded.is_featured,
    search_aliases = excluded.search_aliases,
    sort_order = excluded.sort_order,
    updated_at = now();

update public.skills
set is_active = false,
    is_featured = false,
    updated_at = now()
where slug not in (select slug from canonical_skills);

create temp table canonical_interests (
  slug text not null primary key,
  name text not null,
  sort_order integer not null
) on commit drop;

insert into canonical_interests (slug, name, sort_order)
select raw.value->>'slug', raw.value->>'name', (raw.position::integer * 10)
from jsonb_array_elements(
  $json$
  [
    {"slug":"startups","name":"Startups"},
    {"slug":"entrepreneurship","name":"Entrepreneurship"},
    {"slug":"artificial-intelligence","name":"Artificial Intelligence"},
    {"slug":"machine-learning","name":"Machine Learning"},
    {"slug":"data-analytics","name":"Data & Analytics"},
    {"slug":"fintech","name":"FinTech"},
    {"slug":"edtech","name":"EdTech"},
    {"slug":"healthtech","name":"HealthTech"},
    {"slug":"legaltech","name":"LegalTech"},
    {"slug":"civictech","name":"CivicTech"},
    {"slug":"govtech","name":"GovTech"},
    {"slug":"climatetech","name":"ClimateTech"},
    {"slug":"green-energy","name":"Green Energy"},
    {"slug":"energy","name":"Energy"},
    {"slug":"defensetech","name":"DefenseTech"},
    {"slug":"drones-robotics","name":"Drones & Robotics"},
    {"slug":"cybersecurity","name":"Cybersecurity"},
    {"slug":"saas","name":"SaaS"},
    {"slug":"mobile-apps","name":"Mobile Apps"},
    {"slug":"web-apps","name":"Web Apps"},
    {"slug":"ecommerce","name":"E-commerce"},
    {"slug":"marketplaces","name":"Marketplaces"},
    {"slug":"finance","name":"Finance"},
    {"slug":"investing","name":"Investing"},
    {"slug":"economics","name":"Economics"},
    {"slug":"marketing","name":"Marketing"},
    {"slug":"design","name":"Design"},
    {"slug":"media","name":"Media"},
    {"slug":"journalism","name":"Journalism"},
    {"slug":"creator-economy","name":"Creator Economy"},
    {"slug":"gaming","name":"Gaming"},
    {"slug":"ar-vr","name":"AR/VR"},
    {"slug":"education","name":"Education"},
    {"slug":"research","name":"Research"},
    {"slug":"science","name":"Science"},
    {"slug":"biotechnology","name":"Biotechnology"},
    {"slug":"healthcare","name":"Healthcare"},
    {"slug":"psychology","name":"Psychology"},
    {"slug":"international-relations","name":"International Relations"},
    {"slug":"public-policy","name":"Public Policy"},
    {"slug":"human-rights","name":"Human Rights"},
    {"slug":"social-impact","name":"Social Impact"},
    {"slug":"ngos","name":"NGOs"},
    {"slug":"volunteering","name":"Volunteering"},
    {"slug":"sustainability","name":"Sustainability"},
    {"slug":"culture","name":"Culture"},
    {"slug":"art","name":"Art"},
    {"slug":"music","name":"Music"},
    {"slug":"film-video","name":"Film & Video"},
    {"slug":"books-literature","name":"Books & Literature"},
    {"slug":"communities","name":"Communities"},
    {"slug":"events","name":"Events"},
    {"slug":"travel","name":"Travel"},
    {"slug":"sports","name":"Sports"},
    {"slug":"food","name":"Food"},
    {"slug":"fashion","name":"Fashion"},
    {"slug":"space-aerospace","name":"Space & Aerospace"}
  ]
  $json$::jsonb
) with ordinality as raw(value, position);

insert into public.interests (slug, name, is_active, sort_order)
select slug, name, true, sort_order
from canonical_interests
on conflict (slug) do update
set name = excluded.name,
    is_active = excluded.is_active,
    sort_order = excluded.sort_order,
    updated_at = now();

update public.interests
set is_active = false,
    updated_at = now()
where slug not in (select slug from canonical_interests);

create temp table canonical_goals (
  slug text not null primary key,
  name text not null,
  sort_order integer not null
) on commit drop;

insert into canonical_goals (slug, name, sort_order)
select raw.value->>'slug', raw.value->>'name', (raw.position::integer * 10)
from jsonb_array_elements(
  $json$
  [
    {"slug":"build-startup","name":"Build a startup"},
    {"slug":"startup-cofounder","name":"Find a co-founder"},
    {"slug":"build-mvp","name":"Build an MVP"},
    {"slug":"build-app","name":"Build an app"},
    {"slug":"build-website","name":"Build a website"},
    {"slug":"launch-business","name":"Launch a business"},
    {"slug":"join-project-team","name":"Join a project team"},
    {"slug":"project-teammate","name":"Find a project teammate"},
    {"slug":"hackathon-team","name":"Hackathon team"},
    {"slug":"case-competition-team","name":"Case competition team"},
    {"slug":"study-partner","name":"Study together"},
    {"slug":"research","name":"Research together"},
    {"slug":"academic-paper","name":"Write an academic paper"},
    {"slug":"portfolio-project","name":"Build a portfolio project"},
    {"slug":"creative-project","name":"Create a design project"},
    {"slug":"media-project","name":"Create a media project"},
    {"slug":"create-content","name":"Create content together"},
    {"slug":"launch-podcast","name":"Launch a podcast"},
    {"slug":"event","name":"Organize an event"},
    {"slug":"student-community","name":"Build a student community"},
    {"slug":"start-club","name":"Start a club"},
    {"slug":"volunteering","name":"Launch a volunteering initiative"},
    {"slug":"ngo-social-project","name":"Build an NGO / social project"},
    {"slug":"apply-grant","name":"Apply for a grant"},
    {"slug":"validate-business-idea","name":"Validate a business idea"},
    {"slug":"startup-pitch","name":"Prepare a startup pitch"},
    {"slug":"mentor-mentee","name":"Find a mentor"},
    {"slug":"mentor-someone","name":"Mentor someone"},
    {"slug":"accountability-partner","name":"Find an accountability partner"},
    {"slug":"practice-language","name":"Practice a language"},
    {"slug":"network-meet-people","name":"Network and meet interesting people"},
    {"slug":"explore-ideas","name":"Explore ideas without a fixed project yet"}
  ]
  $json$::jsonb
) with ordinality as raw(value, position);

insert into public.collaboration_goals (slug, name, is_active, sort_order)
select slug, name, true, sort_order
from canonical_goals
on conflict (slug) do update
set name = excluded.name,
    is_active = excluded.is_active,
    sort_order = excluded.sort_order,
    updated_at = now();

update public.collaboration_goals
set is_active = false,
    updated_at = now()
where slug not in (select slug from canonical_goals);

create or replace function private.has_complete_onboarding_data(check_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    exists (
      select 1
      from public.profiles p
      join public.faculties f on f.id = p.faculty_id
      join public.academic_programs ap
        on ap.id = p.academic_program_id
        and ap.faculty_id = p.faculty_id
      where p.user_id = check_user_id
        and p.profile_status = 'active'::public.profile_status
        and p.deleted_at is null
        and f.is_active
        and ap.is_active
        and char_length(p.full_name) between 2 and 120
        and p.year_of_study between 1 and 6
        and (p.bio is null or char_length(p.bio) <= 500)
        and (p.availability is null or char_length(p.availability) <= 160)
        and exists (
          select 1
          from public.profile_skills ps
          join public.skills s on s.id = ps.skill_id
          where ps.user_id = check_user_id
            and ps.direction = 'offer'::public.skill_direction
            and s.is_active
        )
        and exists (
          select 1
          from public.profile_interests pi
          join public.interests i on i.id = pi.interest_id
          where pi.user_id = check_user_id
            and i.is_active
        )
        and exists (
          select 1
          from public.profile_collaboration_goals pcg
          join public.collaboration_goals cg on cg.id = pcg.collaboration_goal_id
          where pcg.user_id = check_user_id
            and cg.is_active
        )
    ),
    false
  );
$$;

create or replace function public.update_my_profile(
  profile_full_name text,
  profile_faculty_id bigint,
  profile_academic_program_id bigint,
  profile_year_of_study integer,
  profile_bio text,
  profile_availability text,
  offer_skill_ids bigint[],
  looking_for_skill_ids bigint[],
  interest_ids bigint[],
  collaboration_goal_ids bigint[]
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  normalized_full_name text := nullif(btrim(profile_full_name), '');
  normalized_bio text := nullif(btrim(coalesce(profile_bio, '')), '');
  normalized_availability text := nullif(btrim(coalesce(profile_availability, '')), '');
  normalized_offer_skill_ids bigint[];
  normalized_looking_for_skill_ids bigint[];
  normalized_interest_ids bigint[];
  normalized_goal_ids bigint[];
  existing_completed_at timestamptz;
  active_count integer;
  affected_count integer;
begin
  if caller_id is null then
    raise exception 'Authentication required to update profile.'
      using errcode = '42501';
  end if;

  select coalesce(array_agg(distinct raw_id order by raw_id), '{}'::bigint[])
    into normalized_offer_skill_ids
  from unnest(coalesce(offer_skill_ids, '{}'::bigint[])) as input(raw_id)
  where raw_id > 0;

  select coalesce(array_agg(distinct raw_id order by raw_id), '{}'::bigint[])
    into normalized_looking_for_skill_ids
  from unnest(coalesce(looking_for_skill_ids, '{}'::bigint[])) as input(raw_id)
  where raw_id > 0;

  select coalesce(array_agg(distinct raw_id order by raw_id), '{}'::bigint[])
    into normalized_interest_ids
  from unnest(coalesce(interest_ids, '{}'::bigint[])) as input(raw_id)
  where raw_id > 0;

  select coalesce(array_agg(distinct raw_id order by raw_id), '{}'::bigint[])
    into normalized_goal_ids
  from unnest(coalesce(collaboration_goal_ids, '{}'::bigint[])) as input(raw_id)
  where raw_id > 0;

  if normalized_full_name is null
    or char_length(normalized_full_name) < 2
    or char_length(normalized_full_name) > 120
  then
    raise exception 'Full name must be 2-120 characters.'
      using errcode = 'P0001';
  end if;

  if profile_year_of_study is null
    or profile_year_of_study < 1
    or profile_year_of_study > 6
  then
    raise exception 'Year of study must be between 1 and 6.'
      using errcode = 'P0001';
  end if;

  if normalized_bio is not null and char_length(normalized_bio) > 500 then
    raise exception 'Bio is limited to 500 characters.'
      using errcode = 'P0001';
  end if;

  if normalized_availability is not null and char_length(normalized_availability) > 160 then
    raise exception 'Availability is limited to 160 characters.'
      using errcode = 'P0001';
  end if;

  if cardinality(normalized_offer_skill_ids) < 1 then
    raise exception 'At least one offered skill is required.'
      using errcode = 'P0001';
  end if;

  if cardinality(normalized_interest_ids) < 1 then
    raise exception 'At least one interest is required.'
      using errcode = 'P0001';
  end if;

  if cardinality(normalized_goal_ids) < 1 then
    raise exception 'At least one collaboration goal is required.'
      using errcode = 'P0001';
  end if;

  select p.onboarding_completed_at
    into existing_completed_at
  from public.profiles p
  where p.user_id = caller_id
    and p.profile_status = 'active'::public.profile_status
    and p.deleted_at is null;

  if existing_completed_at is null then
    raise exception 'Only completed active profiles can be edited.'
      using errcode = 'P0001';
  end if;

  if not exists (
    select 1
    from public.faculties f
    join public.academic_programs ap on ap.faculty_id = f.id
    where f.id = profile_faculty_id
      and ap.id = profile_academic_program_id
      and f.is_active
      and ap.is_active
  ) then
    raise exception 'Choose an active program from the selected faculty.'
      using errcode = 'P0001';
  end if;

  select count(*)::integer
    into active_count
  from public.skills s
  where s.id = any(normalized_offer_skill_ids)
    and s.is_active;

  if active_count <> cardinality(normalized_offer_skill_ids) then
    raise exception 'Offered skills must be active.'
      using errcode = 'P0001';
  end if;

  select count(*)::integer
    into active_count
  from public.skills s
  where s.id = any(normalized_looking_for_skill_ids)
    and s.is_active;

  if active_count <> cardinality(normalized_looking_for_skill_ids) then
    raise exception 'Looking-for skills must be active.'
      using errcode = 'P0001';
  end if;

  select count(*)::integer
    into active_count
  from public.interests i
  where i.id = any(normalized_interest_ids)
    and i.is_active;

  if active_count <> cardinality(normalized_interest_ids) then
    raise exception 'Interests must be active.'
      using errcode = 'P0001';
  end if;

  select count(*)::integer
    into active_count
  from public.collaboration_goals cg
  where cg.id = any(normalized_goal_ids)
    and cg.is_active;

  if active_count <> cardinality(normalized_goal_ids) then
    raise exception 'Collaboration goals must be active.'
      using errcode = 'P0001';
  end if;

  update public.profiles
  set full_name = normalized_full_name,
      faculty_id = profile_faculty_id,
      academic_program_id = profile_academic_program_id,
      year_of_study = profile_year_of_study,
      bio = normalized_bio,
      availability = normalized_availability
  where user_id = caller_id
    and profile_status = 'active'::public.profile_status
    and deleted_at is null
    and onboarding_completed_at = existing_completed_at;

  get diagnostics affected_count = row_count;
  if affected_count <> 1 then
    raise exception 'Profile update was not authorized.'
      using errcode = '42501';
  end if;

  delete from public.profile_skills
  where user_id = caller_id
    and direction in (
      'offer'::public.skill_direction,
      'looking_for'::public.skill_direction
    );

  insert into public.profile_skills (user_id, skill_id, direction)
  select caller_id, skill_id, 'offer'::public.skill_direction
  from unnest(normalized_offer_skill_ids) as offered(skill_id);

  insert into public.profile_skills (user_id, skill_id, direction)
  select caller_id, skill_id, 'looking_for'::public.skill_direction
  from unnest(normalized_looking_for_skill_ids) as wanted(skill_id);

  delete from public.profile_interests
  where user_id = caller_id;

  insert into public.profile_interests (user_id, interest_id)
  select caller_id, interest_id
  from unnest(normalized_interest_ids) as selected_interests(interest_id);

  delete from public.profile_collaboration_goals
  where user_id = caller_id;

  insert into public.profile_collaboration_goals (user_id, collaboration_goal_id)
  select caller_id, collaboration_goal_id
  from unnest(normalized_goal_ids) as selected_goals(collaboration_goal_id);
end;
$$;

comment on column public.skills.is_featured is
  'Marks canonical skills shown in onboarding suggested skills.';

comment on column public.skills.search_aliases is
  'Canonical search aliases used by onboarding skill search.';

comment on function private.has_complete_onboarding_data(uuid) is
  'Central onboarding completeness predicate. Looking-for skills are optional; offered skills, interests, goals, and active profile taxonomy remain required.';

comment on function public.update_my_profile(
  text,
  bigint,
  bigint,
  integer,
  text,
  text,
  bigint[],
  bigint[],
  bigint[],
  bigint[]
) is
  'Atomically updates the authenticated user''s completed active profile and replaces profile taxonomy relations. Looking-for skills are optional. Runs as security invoker so RLS remains the authorization boundary.';

commit;
