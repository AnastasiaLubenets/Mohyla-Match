"use client";

import { useEffect, useRef, useState } from "react";

import { DiscoveryMultiSelect } from "@/components/matching/discovery-multi-select";
import type {
  FacultyDiscoveryFilterOptions,
  FacultyDiscoveryFilters,
} from "@/lib/matching/faculty-discovery-filters";

type FacultyFilterDropdown = "faculty" | "program" | "expertise" | "interest";

type FacultyFilterFormProps = Readonly<{
  filters: FacultyDiscoveryFilters;
  options: FacultyDiscoveryFilterOptions;
}>;

export function FacultyFilterForm({
  filters,
  options,
}: FacultyFilterFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [draftFilters, setDraftFilters] = useState(filters);
  const [openDropdown, setOpenDropdown] =
    useState<FacultyFilterDropdown | null>(null);

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

  function setDropdownOpen(dropdown: FacultyFilterDropdown, open: boolean) {
    setOpenDropdown(open ? dropdown : null);
  }

  function updateFilter<Key extends keyof FacultyDiscoveryFilters>(
    key: Key,
    value: FacultyDiscoveryFilters[Key],
  ) {
    setDraftFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <form action="/app/faculty" className="mt-4 space-y-3" ref={formRef}>
      {draftFilters.searchQuery ? (
        <input name="q" type="hidden" value={draftFilters.searchQuery} />
      ) : null}
      <DiscoveryMultiSelect
        label="Faculty"
        name="faculty"
        onOpenChange={(open) => setDropdownOpen("faculty", open)}
        onSelectedValuesChange={(values) => updateFilter("facultyNames", values)}
        open={openDropdown === "faculty"}
        options={options.faculties}
        placeholder="Select faculties"
        searchPlaceholder="Search faculties..."
        selectedValues={draftFilters.facultyNames}
      />
      <DiscoveryMultiSelect
        label="Academic program"
        name="program"
        onOpenChange={(open) => setDropdownOpen("program", open)}
        onSelectedValuesChange={(values) => updateFilter("programNames", values)}
        open={openDropdown === "program"}
        options={options.programs}
        placeholder="Select programs"
        searchPlaceholder="Search academic programs..."
        selectedValues={draftFilters.programNames}
      />
      <DiscoveryMultiSelect
        label="Expertise"
        name="expertise"
        onOpenChange={(open) => setDropdownOpen("expertise", open)}
        onSelectedValuesChange={(values) => updateFilter("expertiseSlugs", values)}
        open={openDropdown === "expertise"}
        options={options.expertise}
        placeholder="Select expertise"
        searchPlaceholder="Search expertise..."
        selectedValues={draftFilters.expertiseSlugs}
      />
      <DiscoveryMultiSelect
        label="Research interests"
        name="interest"
        onOpenChange={(open) => setDropdownOpen("interest", open)}
        onSelectedValuesChange={(values) => updateFilter("interestSlugs", values)}
        open={openDropdown === "interest"}
        options={options.interests}
        placeholder="Select interests"
        searchPlaceholder="Search research interests..."
        selectedValues={draftFilters.interestSlugs}
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
