export type SkillPickerOption = Readonly<{
  category: string;
  id: number;
  is_featured: boolean;
  name: string;
  search_aliases: readonly string[];
}>;

function normalized(value: string): string {
  return value.trim().toLocaleLowerCase();
}

export function createSelectedSkillIds(
  skillIds: Iterable<number>,
  skills: readonly SkillPickerOption[],
): number[] {
  const activeSkillIds = new Set(skills.map((skill) => skill.id));
  const selectedIds: number[] = [];

  for (const skillId of skillIds) {
    if (activeSkillIds.has(skillId) && !selectedIds.includes(skillId)) {
      selectedIds.push(skillId);
    }
  }

  return selectedIds;
}

export function getSuggestedSkills(
  skills: readonly SkillPickerOption[],
): SkillPickerOption[] {
  return skills.filter((skill) => skill.is_featured);
}

export function getSelectedSkills(
  skills: readonly SkillPickerOption[],
  selectedSkillIds: readonly number[],
): SkillPickerOption[] {
  const selectedSet = new Set(selectedSkillIds);

  return skills.filter((skill) => selectedSet.has(skill.id));
}

export function toggleSkillSelection(
  selectedSkillIds: readonly number[],
  skillId: number,
): number[] {
  if (selectedSkillIds.includes(skillId)) {
    return selectedSkillIds.filter((selectedSkillId) => selectedSkillId !== skillId);
  }

  return [...selectedSkillIds, skillId];
}

export function searchSkillOptions(
  skills: readonly SkillPickerOption[],
  query: string,
  selectedSkillIds: readonly number[] = [],
): SkillPickerOption[] {
  const searchTerm = normalized(query);

  if (!searchTerm) {
    return [];
  }

  const selectedSet = new Set(selectedSkillIds);

  return skills.filter((skill) => {
    if (selectedSet.has(skill.id)) {
      return false;
    }

    const searchableValues = [
      skill.name,
      skill.category,
      ...skill.search_aliases,
    ];

    return searchableValues.some((value) =>
      normalized(value).includes(searchTerm),
    );
  });
}
