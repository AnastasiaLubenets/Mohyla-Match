export const discoveryViews = ["recommended", "all"] as const;
export const discoveryAudiences = ["students", "faculty"] as const;

export type DiscoveryView = (typeof discoveryViews)[number];
export type DiscoveryAudience = (typeof discoveryAudiences)[number];

type QueryValue = string | string[] | undefined;

type QueryParams = Record<string, QueryValue>;

const preservedDiscoveryParams = [
  "audience",
  "expertise",
  "faculty",
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

function queryValues(value: QueryValue) {
  const rawValues = Array.isArray(value) ? value : value ? [value] : [];

  return [
    ...new Set(
      rawValues.map((item) => item.trim()).filter((item) => item.length > 0),
    ),
  ];
}

export function createDiscoveryView(value: QueryValue): DiscoveryView {
  return firstQueryValue(value) === "all" ? "all" : "recommended";
}

export function createDiscoveryAudience(value: QueryValue): DiscoveryAudience {
  return firstQueryValue(value) === "faculty" ? "faculty" : "students";
}

export function discoveryViewHref(
  query: QueryParams,
  view: DiscoveryView,
) {
  const searchParams = new URLSearchParams({ view });

  preservedDiscoveryParams.forEach((key) => {
    queryValues(query[key]).forEach((value) => {
      searchParams.append(key, value);
    });
  });

  return `/app?${searchParams.toString()}`;
}

export function discoveryAudienceHref(
  query: QueryParams,
  audience: DiscoveryAudience,
) {
  const searchParams = new URLSearchParams({ audience });

  preservedDiscoveryParams.forEach((key) => {
    if (key === "audience") {
      return;
    }

    queryValues(query[key]).forEach((value) => {
      searchParams.append(key, value);
    });
  });

  if (audience === "students") {
    searchParams.set("view", firstQueryValue(query.view) ?? "recommended");
  }

  return `/app?${searchParams.toString()}`;
}
