import assert from "node:assert/strict";
import test from "node:test";

import {
  mergeProfileSectionUpdate,
  profileEditDataToPayload,
} from "../src/lib/profile/section-update.ts";
import type { EditProfileData } from "../src/lib/profile/data.ts";

const editData: EditProfileData = {
  collaborationGoalIds: [301],
  collaborationGoals: [
    { id: 301, name: "Build a startup" },
    { id: 302, name: "Research together" },
  ],
  faculties: [{ display_name: "Faculty of Informatics", id: 1 }],
  interestIds: [201],
  interests: [
    { id: 201, name: "Technology" },
    { id: 202, name: "Research" },
  ],
  offeredSkillIds: [101],
  profile: {
    academic_program_id: 11,
    allow_direct_contact: true,
    availability: "Evenings",
    bio: "Original bio",
    faculty_id: 1,
    full_name: "Anastasiia L.",
    system_avatar_key: "stable-avatar",
    year_of_study: 2,
  },
  programs: [{ display_name: "Computer Science", faculty_id: 1, id: 11 }],
  skills: [
    {
      category: "Software & Web",
      id: 101,
      is_featured: true,
      name: "React",
      search_aliases: ["reactjs"],
    },
    {
      category: "Data, AI & Analytics",
      id: 102,
      is_featured: true,
      name: "SQL",
      search_aliases: ["database"],
    },
    {
      category: "Design",
      id: 103,
      is_featured: false,
      name: "Figma",
      search_aliases: ["figjam"],
    },
  ],
  wantedSkillIds: [102],
};

test("section update merges bio while preserving unrelated profile fields", () => {
  const result = mergeProfileSectionUpdate(editData, {
    bio: "  Updated bio  ",
    section: "bio",
    userId: "00000000-0000-4000-8000-000000000999",
  });

  assert.equal(result.ok, true);

  if (!result.ok) {
    return;
  }

  assert.equal(result.payload.bio, "Updated bio");
  assert.equal(result.payload.availability, "Evenings");
  assert.deepEqual(result.payload.offerSkillIds, [101]);
  assert.deepEqual(result.payload.lookingForSkillIds, [102]);
  assert.deepEqual(result.payload.interestIds, [201]);
  assert.deepEqual(result.payload.collaborationGoalIds, [301]);
});

test("section update rejects zero offered skills because offered skills are required", () => {
  const result = mergeProfileSectionUpdate(editData, {
    ids: [],
    section: "offeredSkills",
  });

  assert.deepEqual(result, {
    error: "Choose at least one offered skill.",
    ok: false,
  });
});

test("section update allows zero looking-for skills", () => {
  const result = mergeProfileSectionUpdate(editData, {
    ids: [],
    section: "lookingForSkills",
  });

  assert.equal(result.ok, true);

  if (!result.ok) {
    return;
  }

  assert.deepEqual(result.payload.lookingForSkillIds, []);
  assert.deepEqual(result.payload.offerSkillIds, [101]);
});

test("section update allows zero academic interests", () => {
  const result = mergeProfileSectionUpdate(editData, {
    ids: [],
    section: "interests",
  });

  assert.equal(result.ok, true);

  if (!result.ok) {
    return;
  }

  assert.deepEqual(result.payload.interestIds, []);
  assert.deepEqual(result.payload.collaborationGoalIds, [301]);
});

test("section update allows zero collaboration goals", () => {
  const result = mergeProfileSectionUpdate(editData, {
    ids: [],
    section: "collaborationGoals",
  });

  assert.equal(result.ok, true);

  if (!result.ok) {
    return;
  }

  assert.deepEqual(result.payload.collaborationGoalIds, []);
  assert.deepEqual(result.payload.interestIds, [201]);
});

test("section update rejects non-canonical ids", () => {
  const result = mergeProfileSectionUpdate(editData, {
    ids: [999],
    section: "interests",
  });

  assert.deepEqual(result, {
    error: "Choose valid academic interests.",
    ok: false,
  });
});

test("current edit data converts to a complete canonical update payload", () => {
  assert.deepEqual(profileEditDataToPayload(editData), {
    academicProgramId: 11,
    allowDirectContact: true,
    availability: "Evenings",
    bio: "Original bio",
    collaborationGoalIds: [301],
    facultyId: 1,
    fullName: "Anastasiia L.",
    interestIds: [201],
    lookingForSkillIds: [102],
    offerSkillIds: [101],
    yearOfStudy: 2,
  });
});
