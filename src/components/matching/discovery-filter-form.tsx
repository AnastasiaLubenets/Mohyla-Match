"use client";

import { useEffect, useRef, useState } from "react";

import { DiscoveryMultiSelect } from "@/components/matching/discovery-multi-select";
import {
  type DiscoveryFilterOptions,
  type DiscoveryFilters,
} from "@/lib/matching/discovery-filters";
import { type DiscoveryView } from "@/lib/matching/discovery-view";

type DiscoveryFilterDropdown =
  | "goal"
  | "program"
  | "year"
  | "skill"
  | "interest";

type DiscoveryFilterFormProps = Readonly<{
  filters: DiscoveryFilters;
  options: DiscoveryFilterOptions;
  view: DiscoveryView;
}>;

export function DiscoveryFilterForm({
  filters,
  options,
  view,
}: DiscoveryFilterFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [openDropdown, setOpenDropdown] =
    useState<DiscoveryFilterDropdown | null>(null);

  useEffect(() => {
    if (!openDropdown) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      const openRoot = formRef.current?.querySelector(
        `[data-discovery-filter="${openDropdown}"]`,
      );

      if (openRoot?.contains(target)) {
        return;
      }

      setOpenDropdown(null);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenDropdown(null);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openDropdown]);

  function setDropdownOpen(dropdown: DiscoveryFilterDropdown, open: boolean) {
    setOpenDropdown(open ? dropdown : null);
  }

  return (
    <form action="/app" className="mt-4 space-y-3" ref={formRef}>
      <input name="view" type="hidden" value={view} />
      {filters.searchQuery ? (
        <input name="q" type="hidden" value={filters.searchQuery} />
      ) : null}
      <DiscoveryMultiSelect
        key={`goal-${filters.collaborationGoalSlugs.join("\u001f")}`}
        label="Collaboration goal"
        name="goal"
        onOpenChange={(open) => setDropdownOpen("goal", open)}
        open={openDropdown === "goal"}
        options={options.collaborationGoals}
        placeholder="Select goals"
        searchPlaceholder="Search collaboration goals..."
        selectedValues={filters.collaborationGoalSlugs}
      />
      <DiscoveryMultiSelect
        key={`program-${filters.programNames.join("\u001f")}`}
        label="Academic program"
        name="program"
        onOpenChange={(open) => setDropdownOpen("program", open)}
        open={openDropdown === "program"}
        options={options.programs}
        placeholder="Select programs"
        searchPlaceholder="Search academic programs..."
        selectedValues={filters.programNames}
      />
      <DiscoveryMultiSelect
        key={`year-${filters.yearsOfStudy.join("\u001f")}`}
        label="Year of study"
        name="year"
        onOpenChange={(open) => setDropdownOpen("year", open)}
        open={openDropdown === "year"}
        options={options.years}
        placeholder="Select years"
        searchPlaceholder="Search years..."
        selectedValues={filters.yearsOfStudy}
      />
      <DiscoveryMultiSelect
        key={`skill-${filters.skillSlugs.join("\u001f")}`}
        label="Skills"
        name="skill"
        onOpenChange={(open) => setDropdownOpen("skill", open)}
        open={openDropdown === "skill"}
        options={options.skills}
        placeholder="Select skills"
        searchPlaceholder="Search skills..."
        selectedValues={filters.skillSlugs}
      />
      <DiscoveryMultiSelect
        key={`interest-${filters.interestSlugs.join("\u001f")}`}
        label="Interests"
        name="interest"
        onOpenChange={(open) => setDropdownOpen("interest", open)}
        open={openDropdown === "interest"}
        options={options.interests}
        placeholder="Select interests"
        searchPlaceholder="Search interests..."
        selectedValues={filters.interestSlugs}
      />
      <button
        className="mt-2 inline-flex h-12 w-full items-center justify-center rounded-md bg-blue-800 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-900"
        type="submit"
      >
        Apply filters
      </button>
    </form>
  );
}
