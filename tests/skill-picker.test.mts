import assert from "node:assert/strict";
import test from "node:test";

import {
  createSelectedSkillIds,
  getSelectedSkills,
  getSuggestedSkills,
  searchSkillOptions,
  toggleSkillSelection,
  type SkillPickerOption,
} from "../src/lib/onboarding/skill-picker.ts";

const skills: SkillPickerOption[] = [
  {
    category: "Software & Web",
    id: 1,
    is_featured: true,
    name: "React",
    search_aliases: ["reactjs"],
  },
  {
    category: "Data, AI & Analytics",
    id: 2,
    is_featured: true,
    name: "AI / LLMs",
    search_aliases: ["ai", "artificial intelligence", "llms"],
  },
  {
    category: "Product & Project",
    id: 3,
    is_featured: false,
    name: "Project Management",
    search_aliases: ["pm"],
  },
  {
    category: "Marketing & Communications",
    id: 4,
    is_featured: false,
    name: "Copywriting",
    search_aliases: ["copy"],
  },
];

test("skill picker exposes featured skills for suggested rendering", () => {
  assert.deepEqual(
    getSuggestedSkills(skills).map((skill) => skill.name),
    ["React", "AI / LLMs"],
  );
});

test("skill search matches name, category, and aliases case-insensitively", () => {
  assert.deepEqual(
    searchSkillOptions(skills, "rea").map((skill) => skill.name),
    ["React"],
  );
  assert.deepEqual(
    searchSkillOptions(skills, "analytics").map((skill) => skill.name),
    ["AI / LLMs"],
  );
  assert.deepEqual(
    searchSkillOptions(skills, "PM").map((skill) => skill.name),
    ["Project Management"],
  );
});

test("selected search results become selected skill chips without duplicates", () => {
  const selected = toggleSkillSelection([1], 3);
  const deduped = toggleSkillSelection(selected, 3);

  assert.deepEqual(getSelectedSkills(skills, selected).map((skill) => skill.name), [
    "React",
    "Project Management",
  ]);
  assert.deepEqual(deduped, [1]);
});

test("selected items are excluded from search results", () => {
  assert.deepEqual(
    searchSkillOptions(skills, "software", [1]).map((skill) => skill.name),
    [],
  );
});

test("previous selections are restored and deduplicated when navigating back", () => {
  assert.deepEqual(createSelectedSkillIds([2, 1, 2, 999], skills), [2, 1]);
});
