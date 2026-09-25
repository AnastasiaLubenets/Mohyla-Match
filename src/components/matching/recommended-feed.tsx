"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { DiscoveryCard } from "@/components/matching/discovery-card";
import type { DiscoveryCandidate } from "@/lib/matching/data";

export function RecommendedFeed({
  allStudentsHref,
  candidates,
  emptyDescription,
  emptyTitle,
  error,
  loadError,
  returnTo,
  savedProfileIds,
  status,
}: Readonly<{
  allStudentsHref: string;
  candidates: readonly DiscoveryCandidate[];
  emptyDescription: string;
  emptyTitle: string;
  error?: string;
  loadError?: boolean;
  returnTo: string;
  savedProfileIds: readonly string[];
  status?: string;
}>) {
  const [dismissedIds, setDismissedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const savedSet = useMemo(() => new Set(savedProfileIds), [savedProfileIds]);
  const visibleCandidates = candidates.filter(
    (candidate) => !dismissedIds.has(candidate.userId),
  );

  function handleSkip(userId: string) {
    setDismissedIds((current) => {
      if (current.has(userId)) {
        return current;
      }

      const next = new Set(current);
      next.add(userId);
      return next;
    });
  }

  if (loadError) {
    return (
      <DiscoveryCard
        candidate={null}
        emptyDescription="Try again in a moment."
        emptyTitle="Could not load recommendations."
        error={error}
        showProfileAction={false}
        status={status}
      />
    );
  }

  if (visibleCandidates.length === 0) {
    return (
      <DiscoveryCard
        candidate={null}
        emptyAction={
          <Link
            className="inline-flex h-12 items-center justify-center rounded-md bg-blue-800 px-5 text-sm font-bold text-white transition hover:bg-blue-900"
            href={allStudentsHref}
            scroll={false}
          >
            Browse all students
          </Link>
        }
        emptyDescription={emptyDescription}
        emptyTitle={emptyTitle}
        error={error}
        showProfileAction={false}
        status={status}
      />
    );
  }

  return (
    <div className="space-y-5">
      {visibleCandidates.map((candidate, index) => (
        <DiscoveryCard
          candidate={candidate}
          error={index === 0 ? error : undefined}
          key={candidate.userId}
          onSkip={handleSkip}
          returnTo={returnTo}
          saved={savedSet.has(candidate.userId)}
          status={index === 0 ? status : undefined}
        />
      ))}
    </div>
  );
}
