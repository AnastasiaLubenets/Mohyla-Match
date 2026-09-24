export const discoveryViews = ["recommended", "all"] as const;

export type DiscoveryView = (typeof discoveryViews)[number];

type QueryValue = string | string[] | undefined;

type QueryParams = Record<string, QueryValue>;

const preservedDiscoveryParams = [
  "goal",
  "interest",
  "program",
  "q",
  "skill",
  "year",
] as const;

function firstQueryValue(value: QueryValue) {
  return Array.isArray(value) ? value[0] : value;
}

export function createDiscoveryView(value: QueryValue): DiscoveryView {
  return firstQueryValue(value) === "all" ? "all" : "recommended";
}

export function discoveryViewHref(
  query: QueryParams,
  view: DiscoveryView,
) {
  const searchParams = new URLSearchParams({ view });

  preservedDiscoveryParams.forEach((key) => {
    const value = firstQueryValue(query[key])?.trim();

    if (value) {
      searchParams.set(key, value);
    }
  });

  return `/app?${searchParams.toString()}`;
}
