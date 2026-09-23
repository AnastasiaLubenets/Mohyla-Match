"use client";

import { useId, useMemo, useState, type KeyboardEvent } from "react";

export type TaxonomyPickerOption = Readonly<{
  category?: string;
  id: number;
  is_featured?: boolean;
  name: string;
  search_aliases?: readonly string[];
}>;

type TaxonomyMultiSelectProps = Readonly<{
  disabled?: boolean;
  emptyLabel?: string;
  error?: string | null;
  fieldName?: string;
  label: string;
  onChange: (selectedIds: number[]) => void;
  options: readonly TaxonomyPickerOption[];
  placeholder: string;
  required?: boolean;
  selectedIds: readonly number[];
  suggestedLabel?: string;
}>;

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function dedupeSelectedIds(
  selectedIds: readonly number[],
  options: readonly TaxonomyPickerOption[],
): number[] {
  const availableIds = new Set(options.map((option) => option.id));
  const normalizedIds: number[] = [];

  for (const id of selectedIds) {
    if (availableIds.has(id) && !normalizedIds.includes(id)) {
      normalizedIds.push(id);
    }
  }

  return normalizedIds;
}

function searchOptions(
  options: readonly TaxonomyPickerOption[],
  query: string,
  selectedIds: readonly number[],
): TaxonomyPickerOption[] {
  const searchTerm = normalize(query);

  if (!searchTerm) {
    return [];
  }

  const selected = new Set(selectedIds);

  return options.filter((option) => {
    if (selected.has(option.id)) {
      return false;
    }

    return [
      option.name,
      option.category ?? "",
      ...(option.search_aliases ?? []),
    ].some((value) => normalize(value).includes(searchTerm));
  });
}

function selectedOptions(
  options: readonly TaxonomyPickerOption[],
  selectedIds: readonly number[],
): TaxonomyPickerOption[] {
  const selected = new Set(selectedIds);
  return options.filter((option) => selected.has(option.id));
}

function suggestedOptions(
  options: readonly TaxonomyPickerOption[],
  selectedIds: readonly number[],
): TaxonomyPickerOption[] {
  const selected = new Set(selectedIds);
  const featured = options.filter(
    (option) => option.is_featured && !selected.has(option.id),
  );
  const fallback = options.filter((option) => !selected.has(option.id));

  return (featured.length > 0 ? featured : fallback).slice(0, 8);
}

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
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

export function TaxonomyMultiSelect({
  disabled = false,
  emptyLabel = "Nothing selected yet.",
  error,
  fieldName,
  label,
  onChange,
  options,
  placeholder,
  required = false,
  selectedIds,
  suggestedLabel = "Suggested",
}: TaxonomyMultiSelectProps) {
  const listboxId = useId();
  const inputId = useId();
  const normalizedSelectedIds = useMemo(
    () => dedupeSelectedIds(selectedIds, options),
    [options, selectedIds],
  );
  const selected = useMemo(
    () => selectedOptions(options, normalizedSelectedIds),
    [normalizedSelectedIds, options],
  );
  const suggestions = useMemo(
    () => suggestedOptions(options, normalizedSelectedIds),
    [normalizedSelectedIds, options],
  );
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const hasQuery = query.trim().length > 0;
  const results = useMemo(
    () => searchOptions(options, query, normalizedSelectedIds).slice(0, 12),
    [normalizedSelectedIds, options, query],
  );

  function addOption(optionId: number) {
    if (normalizedSelectedIds.includes(optionId) || disabled) {
      return;
    }

    onChange([...normalizedSelectedIds, optionId]);
    setQuery("");
    setActiveIndex(0);
  }

  function removeOption(optionId: number) {
    if (disabled) {
      return;
    }

    onChange(normalizedSelectedIds.filter((id) => id !== optionId));
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!hasQuery || results.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((currentIndex) =>
        Math.min(currentIndex + 1, results.length - 1),
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((currentIndex) => Math.max(currentIndex - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      addOption(results[activeIndex]?.id ?? 0);
    } else if (event.key === "Escape") {
      setQuery("");
      setActiveIndex(0);
    }
  }

  return (
    <div className="space-y-3">
      {fieldName
        ? normalizedSelectedIds.map((selectedId) => (
            <input
              key={`${fieldName}-${selectedId}`}
              name={fieldName}
              type="hidden"
              value={selectedId}
            />
          ))
        : null}

      <label className="block" htmlFor={inputId}>
        <span className="sr-only">
          {label}
          {required ? " required" : ""}
        </span>
        <span className="relative block">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-blue-500">
            <SearchIcon />
          </span>
          <input
            aria-activedescendant={
              hasQuery && results[activeIndex]
                ? `${listboxId}-${results[activeIndex].id}`
                : undefined
            }
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-expanded={hasQuery}
            className="h-11 w-full rounded-md border border-blue-200 bg-white pl-11 pr-10 text-sm font-medium text-blue-950 outline-none transition placeholder:text-blue-400 focus:border-blue-400 disabled:cursor-not-allowed disabled:bg-blue-50"
            disabled={disabled}
            id={inputId}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleSearchKeyDown}
            placeholder={placeholder}
            role="combobox"
            type="search"
            value={query}
          />
          {query ? (
            <button
              aria-label="Clear search"
              className="absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-blue-500 transition hover:bg-blue-50 hover:text-blue-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
              disabled={disabled}
              onClick={() => {
                setQuery("");
                setActiveIndex(0);
              }}
              type="button"
            >
              x
            </button>
          ) : null}
        </span>
      </label>

      {hasQuery ? (
        <div
          className="max-h-64 overflow-y-auto rounded-md border border-blue-100 bg-white shadow-lg"
          id={listboxId}
          role="listbox"
        >
          {results.length > 0 ? (
            results.map((option, index) => (
              <button
                aria-selected={index === activeIndex}
                className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-blue-700 ${
                  index === activeIndex ? "bg-blue-50" : ""
                }`}
                disabled={disabled}
                id={`${listboxId}-${option.id}`}
                key={option.id}
                onClick={() => addOption(option.id)}
                role="option"
                type="button"
              >
                <span className="font-semibold text-blue-950">{option.name}</span>
                {option.category ? (
                  <span className="text-xs font-semibold text-blue-500">
                    {option.category}
                  </span>
                ) : null}
              </button>
            ))
          ) : (
            <p className="px-4 py-3 text-sm font-medium text-blue-700/70">
              No canonical options match this search.
            </p>
          )}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {selected.length > 0 ? (
          selected.map((option) => (
            <span
              className="inline-flex min-h-8 items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800 ring-1 ring-blue-100"
              key={option.id}
            >
              {option.name}
              <button
                aria-label={`Remove ${option.name}`}
                className="inline-flex h-5 w-5 items-center justify-center rounded-full text-blue-600 transition hover:bg-white hover:text-blue-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                disabled={disabled}
                onClick={() => removeOption(option.id)}
                type="button"
              >
                x
              </button>
            </span>
          ))
        ) : (
          <p className="rounded-md border border-dashed border-blue-200 px-3 py-2 text-sm font-medium text-blue-700/70">
            {emptyLabel}
          </p>
        )}
      </div>

      {suggestions.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-blue-700/70">
            {suggestedLabel}
          </span>
          {suggestions.map((option) => (
            <button
              className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-100 transition hover:bg-blue-100 hover:text-blue-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={disabled}
              key={option.id}
              onClick={() => addOption(option.id)}
              type="button"
            >
              {option.name}
            </button>
          ))}
        </div>
      ) : null}

      {error ? (
        <p className="text-sm font-semibold text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
