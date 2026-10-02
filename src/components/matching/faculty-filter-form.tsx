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

  return (
    <form action="/app" className="mt-4 space-y-3" ref={formRef}>
      <input name="audience" type="hidden" value="faculty" />
      {filters.searchQuery ? (
        <input name="q" type="hidden" value={filters.searchQuery} />
      ) : null}
      <DiscoveryMultiSelect
        key={`faculty-${filters.facultyNames.join("\u001f")}`}
        label="Faculty"
        name="faculty"
        onOpenChange={(open) => setDropdownOpen("faculty", open)}
        open={openDropdown === "faculty"}
        options={options.faculties}
        placeholder="Select faculties"
        searchPlaceholder="Search faculties..."
        selectedValues={filters.facultyNames}
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
        key={`expertise-${filters.expertiseSlugs.join("\u001f")}`}
        label="Expertise"
        name="expertise"
        onOpenChange={(open) => setDropdownOpen("expertise", open)}
        open={openDropdown === "expertise"}
        options={options.expertise}
        placeholder="Select expertise"
        searchPlaceholder="Search expertise..."
        selectedValues={filters.expertiseSlugs}
      />
      <DiscoveryMultiSelect
        key={`interest-${filters.interestSlugs.join("\u001f")}`}
        label="Research interests"
        name="interest"
        onOpenChange={(open) => setDropdownOpen("interest", open)}
        open={openDropdown === "interest"}
        options={options.interests}
        placeholder="Select interests"
        searchPlaceholder="Search research interests..."
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
