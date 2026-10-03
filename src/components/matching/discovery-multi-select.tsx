"use client";

import { useId, useMemo, useState } from "react";

import {
  searchDiscoveryFilterOptions,
  type FilterOption,
} from "@/lib/matching/discovery-filters";

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function ChevronIcon({ open }: Readonly<{ open: boolean }>) {
  return (
    <svg
      aria-hidden="true"
      className={open ? "h-4 w-4 rotate-180" : "h-4 w-4"}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.5"
      viewBox="0 0 24 24"
    >
      <path d="m5 12 4 4 10-10" />
    </svg>
  );
}

export function DiscoveryMultiSelect({
  label,
  name,
  onOpenChange,
  onSelectedValuesChange,
  open,
  options,
  placeholder = "Select options",
  searchPlaceholder = "Search options...",
  selectedValues,
}: Readonly<{
  label: string;
  name: string;
  onOpenChange: (open: boolean) => void;
  onSelectedValuesChange: (selectedValues: readonly string[]) => void;
  open: boolean;
  options: readonly FilterOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  selectedValues: readonly string[];
}>) {
  const baseId = useId();
  const [query, setQuery] = useState("");
  const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues]);
  const optionByValue = useMemo(
    () => new Map(options.map((option) => [option.value, option])),
    [options],
  );
  const selectedOptions = selectedValues.map(
    (value) => optionByValue.get(value) ?? { label: value, value },
  );
  const visibleOptions = searchDiscoveryFilterOptions(options, query);

  function toggleValue(value: string) {
    onSelectedValuesChange(
      selectedValues.includes(value)
        ? selectedValues.filter((item) => item !== value)
        : [...selectedValues, value],
    );
  }

  function removeValue(value: string) {
    onSelectedValuesChange(selectedValues.filter((item) => item !== value));
  }

  return (
    <div className="relative" data-discovery-filter={name}>
      {selectedValues.map((value) => (
        <input key={value} name={name} type="hidden" value={value} />
      ))}
      <div className="flex items-center justify-between gap-3">
        <label
          className="text-sm font-bold text-blue-900"
          htmlFor={`${baseId}-search`}
        >
          {label}
        </label>
        {selectedValues.length > 0 ? (
          <button
            className="text-xs font-bold text-blue-600 transition hover:text-blue-950"
            onClick={() => onSelectedValuesChange([])}
            type="button"
          >
            Clear
          </button>
        ) : null}
      </div>

      <div className="mt-1.5 rounded-md border border-blue-100 bg-white px-2 py-2 transition focus-within:border-blue-300">
        {selectedOptions.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {selectedOptions.map((option) => (
              <span
                className="inline-flex min-h-7 items-center gap-1 rounded-full bg-blue-50 px-2.5 text-xs font-bold text-blue-800 ring-1 ring-blue-100"
                key={option.value}
              >
                {option.label}
                <button
                  aria-label={`Remove ${option.label}`}
                  className="-mr-1 inline-flex size-5 items-center justify-center rounded-full text-blue-600 transition hover:bg-blue-100 hover:text-blue-950"
                  onClick={() => removeValue(option.value)}
                  type="button"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : null}

        <button
          aria-controls={`${baseId}-options`}
          aria-expanded={open}
          className="flex min-h-8 w-full items-center justify-between gap-3 rounded-sm px-1 text-left text-sm font-medium text-blue-900 outline-none transition hover:text-blue-950 focus-visible:ring-2 focus-visible:ring-blue-500"
          onClick={() => onOpenChange(!open)}
          type="button"
        >
          <span className={selectedValues.length > 0 ? "text-blue-700" : "text-blue-400"}>
            {selectedValues.length > 0 ? "+ Select more..." : placeholder}
          </span>
          <ChevronIcon open={open} />
        </button>
      </div>

      {open ? (
        <div
          className="absolute left-0 right-0 z-20 mt-2 rounded-lg border border-blue-100 bg-white p-2 shadow-md"
          id={`${baseId}-options`}
        >
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-blue-400">
              <SearchIcon />
            </span>
            <input
              className="h-10 w-full rounded-md border border-blue-100 bg-blue-50/70 pl-9 pr-3 text-sm font-medium text-blue-950 outline-none transition placeholder:text-blue-400 focus:border-blue-300 focus:bg-white"
              id={`${baseId}-search`}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              type="search"
              value={query}
            />
          </div>

          <div
            aria-label={`${label} options`}
            className="scrollbar-hidden mt-2 max-h-72 overflow-y-auto pr-1"
            role="group"
          >
            {visibleOptions.length > 0 ? (
              visibleOptions.map((option) => {
                const checked = selectedSet.has(option.value);

                return (
                  <label
                    className={
                      checked
                        ? "flex cursor-pointer items-center gap-3 rounded-md bg-blue-50 px-3 py-2 text-sm font-bold text-blue-900"
                        : "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-blue-800 transition hover:bg-blue-50"
                    }
                    key={option.value}
                  >
                    <input
                      checked={checked}
                      className="sr-only"
                      onChange={() => toggleValue(option.value)}
                      type="checkbox"
                    />
                    <span
                      className={
                        checked
                          ? "flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-800 text-white"
                          : "size-5 shrink-0 rounded-full border border-blue-200 bg-white"
                      }
                    >
                      {checked ? <CheckIcon /> : null}
                    </span>
                    <span>{option.label}</span>
                  </label>
                );
              })
            ) : (
              <p className="px-3 py-4 text-sm font-medium text-blue-500">
                No options match.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
