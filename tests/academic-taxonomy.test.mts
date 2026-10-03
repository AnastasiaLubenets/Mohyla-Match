import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();
const migration = readFileSync(
  join(
    root,
    "supabase/migrations/20261003231318_canonical_academic_taxonomy.sql",
  ),
  "utf8",
);

const canonicalFaculties = [
  "Факультет гуманітарних наук",
  "Факультет економічних наук",
  "Факультет соціальних наук та соціальних технологій",
  "Факультет інформатики",
  "Факультет правничих наук",
  "Факультет природничих наук",
  "Факультет охорони здоров’я, соціальної роботи та психології",
];

const canonicalProgramsByFaculty = new Map([
  [
    "faculty-humanities",
    ["Історія та археологія", "Філософія", "Культурологія", "Філологія"],
  ],
  [
    "faculty-economics",
    [
      "Економіка",
      "Фінанси, банківська справа та страхування",
      "Менеджмент",
      "Маркетинг",
    ],
  ],
  [
    "faculty-social-sciences-social-technologies",
    [
      "Політологія",
      "Соціологія",
      "Міжнародні відносини, суспільні комунікації та регіональні студії",
      "Журналістика",
      "Менеджмент",
    ],
  ],
  [
    "faculty-informatics",
    [
      "Прикладна математика",
      "Інженерія програмного забезпечення",
      "Комп'ютерні науки",
      "Системний аналіз",
    ],
  ],
  [
    "faculty-law",
    ["Право", "Публічне управління та адміністрування"],
  ],
  [
    "faculty-natural-sciences",
    ["Біологія", "Екологія", "Хімія", "Фізика та астрономія"],
  ],
  [
    "faculty-health-social-work-psychology",
    [
      "Психологія",
      "Соціальна робота",
      "Громадське здоров'я",
      "Менеджмент в охороні здоров'я",
      "Медицина",
    ],
  ],
]);

function source(path: string) {
  return readFileSync(join(root, path), "utf8");
}

test("canonical migration contains exactly the approved product taxonomy", () => {
  canonicalFaculties.forEach((facultyName) => {
    assert.match(migration, new RegExp(facultyName));
  });

  canonicalProgramsByFaculty.forEach((programs, facultySlug) => {
    programs.forEach((programName) => {
      assert.match(
        migration,
        new RegExp(
          `${facultySlug}'[\\s\\S]*?${programName.replaceAll("'", "''")}`,
        ),
      );
    });
  });

  assert.match(
    migration,
    /display_name in \([\s\S]*Києво-Могилянська Бізнес-Школа \(kmbs\)[\s\S]*Києво-Могилянська школа професійної та неперервної освіти/,
  );
});

test("taxonomy migration safely remaps profile and expertise references before deactivation", () => {
  assert.match(migration, /create temp table program_remap/);
  assert.match(migration, /create temp table profile_program_rows/);
  assert.match(migration, /create temp table program_expertise_rows/);
  assert.match(
    migration,
    /update public\.profiles p[\s\S]*set academic_program_id = pr\.canonical_program_id,[\s\S]*faculty_id = pr\.canonical_faculty_id/,
  );
  assert.match(
    migration,
    /delete from public\.profile_academic_programs;[\s\S]*insert into public\.profile_academic_programs/,
  );
  assert.match(
    migration,
    /delete from public\.academic_program_expertise;[\s\S]*insert into public\.academic_program_expertise/,
  );
  assert.match(
    migration,
    /set is_active = false,[\s\S]*where slug not in \(select slug from canonical_programs\)/,
  );
  assert.doesNotMatch(migration, /drop policy|alter table .*disable row level security/i);
});

test("student and faculty setup use faculty-dependent program selectors", () => {
  const accountSetup = source("src/app/account/setup/page.tsx");
  const studentBasicForm = source("src/components/onboarding-basic-form.tsx");
  const facultyProgramsForm = source("src/components/faculty-programs-form.tsx");

  assert.match(accountSetup, /<FacultyProgramsForm[\s\S]*?faculties=\{/);
  assert.doesNotMatch(accountSetup, /function programLabel/);
  assert.match(
    studentBasicForm,
    /const nextPrograms = programs\.filter\([\s\S]*?program\.faculty_id === nextFacultyId/,
  );
  assert.match(studentBasicForm, /setSelectedProgramId\(nextPrograms\[0\]\?\.id \?\? null\)/);
  assert.match(facultyProgramsForm, /name="facultyId"/);
  assert.match(facultyProgramsForm, /availablePrograms\.map\(\(program\)/);
  assert.match(facultyProgramsForm, /setSelectedProgramId\(nextPrimaryId\)/);
  assert.match(facultyProgramsForm, /programBelongsToFaculty/);
});

test("profile editing and display surfaces do not expose Bachelor/Master labels", () => {
  const checkedSources = [
    "src/app/account/setup/page.tsx",
    "src/components/faculty-programs-form.tsx",
    "src/components/profile/profile-edit-form.tsx",
    "src/components/profile/my-profile-dashboard.tsx",
    "src/components/profile/full-student-profile.tsx",
    "src/components/matching/faculty-directory-list.tsx",
  ];

  checkedSources.forEach((path) => {
    const fileSource = source(path);

    assert.doesNotMatch(fileSource, /Bachelor|Master/);
  });

  assert.match(
    source("src/components/profile/profile-edit-form.tsx"),
    /const \[selectedFacultyId, setSelectedFacultyId\]/,
  );
  assert.match(
    source("src/components/profile/profile-edit-form.tsx"),
    /availablePrograms\.map\(\(program\)/,
  );
});

test("discover program filter choices are deduplicated by visible program name", () => {
  const matchingData = source("src/lib/matching/data.ts");

  assert.match(matchingData, /function uniqueFilterOptions/);
  assert.match(
    matchingData,
    /programs: uniqueFilterOptions\([\s\S]*?program\.display_name/,
  );
});
