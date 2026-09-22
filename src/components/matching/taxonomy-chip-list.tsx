import type { MatchingItem, MatchingSkill } from "@/lib/matching/data";

type TaxonomyChipListProps<TItem extends MatchingItem | MatchingSkill> = Readonly<{
  emptyLabel?: string;
  items: readonly TItem[];
  showCategory?: boolean;
}>;

export function TaxonomyChipList<TItem extends MatchingItem | MatchingSkill>({
  emptyLabel = "Nothing listed yet.",
  items,
  showCategory = false,
}: TaxonomyChipListProps<TItem>) {
  if (items.length === 0) {
    return <p className="text-sm text-muted">{emptyLabel}</p>;
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-800"
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
    </ul>
  );
}
