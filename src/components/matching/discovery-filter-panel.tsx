"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { DiscoveryFilterForm } from "@/components/matching/discovery-filter-form";
import {
  emptyDiscoveryFilters,
  hasActiveDiscoveryFilters,
  type DiscoveryFilterOptions,
  type DiscoveryFilters,
} from "@/lib/matching/discovery-filters";
import {
  discoveryViewHref,
  type DiscoveryView,
} from "@/lib/matching/discovery-view";

function filterStateKey(filters: DiscoveryFilters) {
  return JSON.stringify(filters);
}

export function DiscoveryFilterPanel({
  filters,
  options,
  resultCount,
  totalCount,
  view,
}: Readonly<{
  filters: DiscoveryFilters;
  options: DiscoveryFilterOptions;
  resultCount: number;
  totalCount: number;
  view: DiscoveryView;
}>) {
  return (
    <DiscoveryFilterPanelDraft
      filters={filters}
      key={filterStateKey(filters)}
      options={options}
      resultCount={resultCount}
      totalCount={totalCount}
      view={view}
    />
  );
}

function DiscoveryFilterPanelDraft({
  filters,
  options,
  resultCount,
  totalCount,
  view,
}: Readonly<{
  filters: DiscoveryFilters;
  options: DiscoveryFilterOptions;
  resultCount: number;
  totalCount: number;
  view: DiscoveryView;
}>) {
  const router = useRouter();
  const [draftFilters, setDraftFilters] = useState(filters);
  const draftActive = hasActiveDiscoveryFilters(draftFilters);
  const appliedActive = hasActiveDiscoveryFilters(filters);
  const resetEnabled = draftActive || appliedActive;

  function resetFilters() {
    if (!resetEnabled) {
      return;
    }

    setDraftFilters(emptyDiscoveryFilters);

    if (appliedActive) {
      router.push(discoveryViewHref({}, view), { scroll: false });
    }
  }

  return (
    <section className="rounded-lg border border-blue-100 bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-serif text-3xl font-bold leading-none text-blue-950">
          Filters
        </h2>
        <button
          className={
            resetEnabled
              ? "text-sm font-bold text-blue-700 transition hover:text-blue-950"
              : "cursor-not-allowed text-sm font-bold text-blue-300"
          }
          disabled={!resetEnabled}
          onClick={resetFilters}
          type="button"
        >
          Reset
        </button>
      </div>

      <p className="sr-only">
        Showing {resultCount} of {totalCount} available profiles.
      </p>

      <DiscoveryFilterForm
        filters={draftFilters}
        onFiltersChange={setDraftFilters}
        options={options}
        view={view}
      />
    </section>
  );
}
