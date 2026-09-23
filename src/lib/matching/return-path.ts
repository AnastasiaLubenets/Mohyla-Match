export function pathWithMergedParams(
  pathname: string,
  params: Record<string, string | null | undefined>,
) {
  const [path, query = ""] = pathname.split("?", 2);
  const searchParams = new URLSearchParams(query);

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    } else {
      searchParams.delete(key);
    }
  });

  const nextQuery = searchParams.toString();
  return nextQuery ? `${path}?${nextQuery}` : path;
}
