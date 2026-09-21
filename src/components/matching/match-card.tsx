import Link from "next/link";

import { ContactReveal } from "@/components/matching/contact-reveal";
import { TaxonomyChipList } from "@/components/matching/taxonomy-chip-list";
import { SystemAvatar } from "@/components/profile/system-avatar";
import type { MatchSummary } from "@/lib/matching/data";
import { formatMatchedDate } from "@/lib/matching/view-model";

export function MatchCard({ match }: Readonly<{ match: MatchSummary }>) {
  return (
    <article className="rounded-lg border border-border bg-surface p-5 shadow-sm sm:p-6">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <SystemAvatar
            availability={match.availability}
            facultyName={match.facultyName}
            fullName={match.fullName}
            programName={match.academicProgramName}
            size="md"
            systemAvatarKey={match.systemAvatarKey}
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">
              Matched {formatMatchedDate(match.matchedAt)}
            </p>
            <h2 className="mt-2 text-2xl font-semibold">{match.fullName}</h2>
            <p className="mt-2 text-sm font-medium text-muted">
              {match.facultyName} · {match.academicProgramName} · Year{" "}
              {match.yearOfStudy}
            </p>
          </div>
        </div>
        <Link
          className="inline-flex h-11 items-center justify-center rounded-full border border-border px-4 text-sm font-semibold transition hover:border-primary"
          href={`/profiles/${match.userId}`}
        >
          View profile
        </Link>
      </header>

      <p className="mt-5 leading-7 text-muted">{match.bio || "No bio yet."}</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section>
          <h3 className="text-sm font-semibold">Can offer</h3>
          <div className="mt-3">
            <TaxonomyChipList items={match.offeredSkills} showCategory />
          </div>
        </section>
        <section>
          <h3 className="text-sm font-semibold">Looking for</h3>
          <div className="mt-3">
            <TaxonomyChipList
              emptyLabel="No looking-for skills listed."
              items={match.lookingForSkills}
              showCategory
            />
          </div>
        </section>
      </div>

      {match.canDirectContact ? (
        <div className="mt-6 border-t border-border pt-5">
          <ContactReveal fullName={match.fullName} targetUserId={match.userId} />
        </div>
      ) : null}
    </article>
  );
}
