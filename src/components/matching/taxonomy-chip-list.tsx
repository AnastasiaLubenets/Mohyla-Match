import type { MatchingItem, MatchingSkill } from "@/lib/matching/data";

type TaxonomyChipListProps<TItem extends MatchingItem | MatchingSkill> = Readonly<{
  emptyLabel?: string;
  items: readonly TItem[];
  limit?: number;
  showCategory?: boolean;
}>;

export function TaxonomyChipList<TItem extends MatchingItem | MatchingSkill>({
  emptyLabel = "Nothing listed yet.",
  items,
  limit,
  showCategory = false,
}: TaxonomyChipListProps<TItem>) {
  if (items.length === 0) {
    return <p className="text-sm text-muted">{emptyLabel}</p>;
  }

  const visibleItems = limit ? items.slice(0, limit) : items;
  const hiddenCount = limit && items.length > limit ? items.length - limit : 0;

  return (
    <ul className="flex flex-wrap gap-2">
      {visibleItems.map((item) => (
        <li
          className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800 ring-1 ring-blue-100/70"
          key={`${item.slug}-${item.id}`}
        >
          {item.name}
          {showCategory && "category" in item ? (
            <span className="ml-2 text-xs font-medium text-blue-500">
              {item.category}
            </span>
          ) : null}
        </li>
      ))}
      {hiddenCount ? (
        <li className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-100">
          +{hiddenCount} more
        </li>
      ) : null}
    </ul>
  );
}
