"use client";

import Link from "next/link";
import { useId, useMemo, useState, type KeyboardEvent } from "react";

import { AuthSubmitButton } from "@/components/auth-submit-button";
import {
  onboardingChipClass,
  onboardingFieldClass,
  onboardingLabelClass,
  onboardingPrimaryButtonClass,
  onboardingSecondaryButtonClass,
} from "@/components/onboarding-styles";
import {
  createSelectedSkillIds,
  getSelectedSkills,
  getSuggestedSkills,
  searchSkillOptions,
  toggleSkillSelection,
  type SkillPickerOption,
} from "@/lib/onboarding/skill-picker";

type OnboardingSkillPickerProps = Readonly<{
  action: string;
  backHref: string;
  defaultSkillIds: number[];
  fieldName: string;
  isOptional?: boolean;
  skills: SkillPickerOption[];
  title: string;
}>;

function SkillCategoryTooltip({
  category,
  id,
  placement = "below",
}: Readonly<{
  category: string;
  id: string;
  placement?: "below" | "inline";
}>) {
  return (
    <span
      className={
        placement === "inline"
          ? "pointer-events-none absolute right-3 top-1/2 z-30 max-w-[14rem] -translate-y-1/2 rounded-lg border border-[#cddaf0] bg-white px-2.5 py-1.5 text-xs font-semibold leading-snug text-[#66769e] opacity-0 shadow-sm transition group-hover:opacity-100 group-focus-visible:opacity-100"
          : "pointer-events-none absolute left-12 top-full z-30 mt-2 max-w-[14rem] rounded-lg border border-[#cddaf0] bg-white px-2.5 py-1.5 text-xs font-semibold leading-snug text-[#66769e] opacity-0 shadow-sm transition group-hover:opacity-100 group-focus-visible:opacity-100"
      }
      id={id}
      role="tooltip"
    >
      {category}
    </span>
  );
}

function SkillToggle({
  isSelected,
  onToggle,
  skill,
}: Readonly<{
  isSelected: boolean;
  onToggle: (skillId: number) => void;
  skill: SkillPickerOption;
}>) {
  const tooltipId = useId();

  return (
    <button
      aria-describedby={tooltipId}
      aria-pressed={isSelected}
      className={`group relative flex min-h-12 w-full cursor-pointer items-center justify-start gap-3 rounded-full border px-4 py-3 text-left text-sm font-bold text-[#102653] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#245ba2] ${
        isSelected
          ? "border-[#a9c6ee] bg-[#edf4ff] text-[#174ca7]"
          : "border-[#cddaf0] bg-white/75 hover:border-[#3567a8]"
      }`}
      onClick={() => onToggle(skill.id)}
      type="button"
    >
      <span className="flex min-w-0 flex-1 items-center gap-3">
        <span
          className={`inline-flex size-6 shrink-0 items-center justify-center rounded-full border text-xs ${
            isSelected
              ? "border-[#3567a8] bg-[#3567a8] text-white"
              : "border-[#bed0ea] bg-white text-transparent"
          }`}
          aria-hidden="true"
        >
          ✓
        </span>
        <span className="min-w-0 break-words leading-snug">
          {skill.name}
        </span>
      </span>
      <SkillCategoryTooltip category={skill.category} id={tooltipId} />
    </button>
  );
}

function SelectedSkillChip({
  onRemove,
  skill,
}: Readonly<{
  onRemove: (skillId: number) => void;
  skill: SkillPickerOption;
}>) {
  return (
    <span className={onboardingChipClass}>
      {skill.name}
      <button
        aria-label={`Remove ${skill.name}`}
        className="inline-flex size-6 items-center justify-center rounded-full text-muted transition hover:bg-surface hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        onClick={() => onRemove(skill.id)}
        type="button"
      >
        x
      </button>
    </span>
  );
}

export function OnboardingSkillPicker({
  action,
  backHref,
  defaultSkillIds,
  fieldName,
  isOptional = false,
  skills,
  title,
}: OnboardingSkillPickerProps) {
  const [selectedSkillIds, setSelectedSkillIds] = useState(() =>
    createSelectedSkillIds(defaultSkillIds, skills),
  );
  const [query, setQuery] = useState("");
  const [activeResultIndex, setActiveResultIndex] = useState(0);
  const resultsId = useId();
  const suggestedSkills = useMemo(() => getSuggestedSkills(skills), [skills]);
  const selectedSkills = useMemo(
    () => getSelectedSkills(skills, selectedSkillIds),
    [selectedSkillIds, skills],
  );
  const searchResults = useMemo(
    () => searchSkillOptions(skills, query, selectedSkillIds).slice(0, 10),
    [query, selectedSkillIds, skills],
  );
  const hasQuery = query.trim().length > 0;

  function handleToggle(skillId: number) {
    setSelectedSkillIds((currentSkillIds) =>
      toggleSkillSelection(currentSkillIds, skillId),
    );
  }

  function handleSelectFromSearch(skillId: number) {
    setSelectedSkillIds((currentSkillIds) =>
      currentSkillIds.includes(skillId)
        ? currentSkillIds
        : [...currentSkillIds, skillId],
    );
    setQuery("");
    setActiveResultIndex(0);
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!hasQuery || searchResults.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveResultIndex((currentIndex) =>
        Math.min(currentIndex + 1, searchResults.length - 1),
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveResultIndex((currentIndex) => Math.max(currentIndex - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      handleSelectFromSearch(searchResults[activeResultIndex]?.id ?? 0);
    } else if (event.key === "Escape") {
      setQuery("");
      setActiveResultIndex(0);
    }
  }

  return (
    <form
      action={action}
      aria-label={title}
      className="mt-8 space-y-7"
      method="post"
    >

      {selectedSkillIds.map((skillId) => (
        <input key={skillId} name={fieldName} type="hidden" value={skillId} />
      ))}

      <fieldset className="space-y-3">
        <legend className={onboardingLabelClass}>Suggested skills</legend>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {suggestedSkills.map((skill) => (
            <SkillToggle
              isSelected={selectedSkillIds.includes(skill.id)}
              key={skill.id}
              onToggle={handleToggle}
              skill={skill}
            />
          ))}
        </div>
      </fieldset>

      <section className="space-y-3" aria-labelledby="selected-skills-heading">
        <h2 className={onboardingLabelClass} id="selected-skills-heading">
          Selected skills
        </h2>
        {selectedSkills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedSkills.map((skill) => (
              <SelectedSkillChip
                key={skill.id}
                onRemove={handleToggle}
                skill={skill}
              />
            ))}
          </div>
        ) : (
          <p className="rounded-[0.875rem] border border-dashed border-[#cddaf0] bg-white/50 px-4 py-3 text-sm text-[#66769e]">
            {isOptional
              ? "No looking-for skills selected."
              : "Choose at least one offered skill."}
          </p>
        )}
      </section>

      <div className="space-y-3">
        <label className="block" htmlFor="skill-search">
          <span className={onboardingLabelClass}>Add more skills</span>
          <input
            aria-activedescendant={
              hasQuery && searchResults[activeResultIndex]
                ? `${resultsId}-${searchResults[activeResultIndex].id}`
                : undefined
            }
            aria-autocomplete="list"
            aria-controls={resultsId}
            aria-expanded={hasQuery}
            className={onboardingFieldClass}
            id="skill-search"
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveResultIndex(0);
            }}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search skills"
            role="combobox"
            type="search"
            value={query}
          />
        </label>

        {hasQuery ? (
          <div
            className="max-h-72 overflow-y-auto rounded-[0.875rem] border border-[#cddaf0] bg-white/95 shadow-sm"
            id={resultsId}
            role="listbox"
          >
            {searchResults.length > 0 ? (
              searchResults.map((skill, index) => (
                <button
                  aria-describedby={`${resultsId}-${skill.id}-category`}
                  aria-selected={index === activeResultIndex}
                  className={`group relative flex w-full items-center justify-start gap-3 px-4 py-3 text-left text-sm text-[#102653] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-primary ${
                    index === activeResultIndex
                      ? "bg-[#EAF2FF] hover:bg-[#EAF2FF]"
                      : "bg-white hover:bg-[#F5F8FF]"
                  }`}
                  id={`${resultsId}-${skill.id}`}
                  key={skill.id}
                  onClick={() => handleSelectFromSearch(skill.id)}
                  role="option"
                  type="button"
                >
                  <span className="min-w-0 flex-1 break-words pr-4 font-semibold leading-snug">
                    {skill.name}
                  </span>
                  <SkillCategoryTooltip
                    category={skill.category}
                    id={`${resultsId}-${skill.id}-category`}
                    placement="inline"
                  />
                </button>
              ))
            ) : (
              <p className="px-4 py-3 text-sm text-muted">
                No canonical skills match this search.
              </p>
            )}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          className={onboardingSecondaryButtonClass}
          href={backHref}
        >
          Back
        </Link>
        <div className="flex flex-col gap-3 sm:w-auto sm:min-w-52 sm:flex-row">
          {isOptional ? (
            <button
              className="h-[3.25rem] rounded-full px-5 text-sm font-bold text-[#55688f] transition hover:text-[#102653] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#245ba2]"
              name="skip"
              type="submit"
              value="true"
            >
              Skip for now
            </button>
          ) : null}
          <div className="sm:w-52">
            <AuthSubmitButton
              className={onboardingPrimaryButtonClass}
              pendingLabel="Saving..."
            >
              Continue <span aria-hidden="true">→</span>
            </AuthSubmitButton>
          </div>
        </div>
      </div>
    </form>
  );
}
