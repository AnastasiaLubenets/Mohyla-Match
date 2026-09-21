"use client";

import Link from "next/link";
import { useId, useMemo, useState, type KeyboardEvent } from "react";

import { AuthSubmitButton } from "@/components/auth-submit-button";
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
  description: string;
  fieldName: string;
  isOptional?: boolean;
  skills: SkillPickerOption[];
  title: string;
}>;

function SkillToggle({
  isSelected,
  onToggle,
  skill,
}: Readonly<{
  isSelected: boolean;
  onToggle: (skillId: number) => void;
  skill: SkillPickerOption;
}>) {
  return (
    <button
      aria-pressed={isSelected}
      className={`flex min-h-12 w-full cursor-pointer items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
        isSelected
          ? "border-primary bg-surface-strong"
          : "border-border bg-surface hover:border-primary"
      }`}
      onClick={() => onToggle(skill.id)}
      type="button"
    >
      <span>{skill.name}</span>
      <span className="text-xs font-medium text-muted">{skill.category}</span>
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
    <span className="inline-flex min-h-10 items-center gap-2 rounded-full border border-primary bg-surface-strong px-3 py-2 text-sm font-semibold">
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
  description,
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
    <form action={action} className="mt-8 space-y-7" method="post">
      <div>
        <h1 className="text-3xl font-semibold">{title}</h1>
        <p className="mt-3 leading-7 text-muted">{description}</p>
      </div>

      {selectedSkillIds.map((skillId) => (
        <input key={skillId} name={fieldName} type="hidden" value={skillId} />
      ))}

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">Suggested skills</legend>
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
        <h2 className="text-sm font-semibold" id="selected-skills-heading">
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
          <p className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted">
            {isOptional
              ? "No looking-for skills selected."
              : "Choose at least one offered skill."}
          </p>
        )}
      </section>

      <div className="space-y-3">
        <label className="block" htmlFor="skill-search">
          <span className="text-sm font-semibold">Add more skills</span>
          <input
            aria-activedescendant={
              hasQuery && searchResults[activeResultIndex]
                ? `${resultsId}-${searchResults[activeResultIndex].id}`
                : undefined
            }
            aria-autocomplete="list"
            aria-controls={resultsId}
            aria-expanded={hasQuery}
            className="mt-2 h-12 w-full rounded-lg border border-border bg-surface px-4 text-foreground outline-none transition focus:border-primary"
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
            className="max-h-72 overflow-y-auto rounded-lg border border-border bg-surface shadow-sm"
            id={resultsId}
            role="listbox"
          >
            {searchResults.length > 0 ? (
              searchResults.map((skill, index) => (
                <button
                  aria-selected={index === activeResultIndex}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition hover:bg-surface-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-primary ${
                    index === activeResultIndex ? "bg-surface-strong" : ""
                  }`}
                  id={`${resultsId}-${skill.id}`}
                  key={skill.id}
                  onClick={() => handleSelectFromSearch(skill.id)}
                  role="option"
                  type="button"
                >
                  <span className="font-semibold">{skill.name}</span>
                  <span className="text-xs font-medium text-muted">
                    {skill.category}
                  </span>
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
          className="inline-flex h-12 items-center justify-center rounded-full border border-border px-5 text-sm font-semibold text-foreground transition hover:border-primary"
          href={backHref}
        >
          Back
        </Link>
        <div className="flex flex-col gap-3 sm:w-auto sm:min-w-52 sm:flex-row">
          {isOptional ? (
            <button
              className="h-12 rounded-full border border-border px-5 text-sm font-semibold text-foreground transition hover:border-primary"
              name="skip"
              type="submit"
              value="true"
            >
              Skip for now
            </button>
          ) : null}
          <div className="sm:w-52">
            <AuthSubmitButton pendingLabel="Saving...">Continue</AuthSubmitButton>
          </div>
        </div>
      </div>
    </form>
  );
}
