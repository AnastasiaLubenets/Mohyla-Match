import Link from "next/link";

import { ContactReveal } from "@/components/matching/contact-reveal";
import { TaxonomyChipList } from "@/components/matching/taxonomy-chip-list";
import { SystemAvatar } from "@/components/profile/system-avatar";
import type { MatchSummary } from "@/lib/matching/data";
import { formatMatchedDate } from "@/lib/matching/view-model";

export function MatchCard({ match }: Readonly<{ match: MatchSummary }>) {
  return (
    <article className="mm-panel rounded-lg border border-border bg-surface shadow-sm">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <SystemAvatar
            availability={match.availability}
            avatarMode={match.avatarMode}
            customAvatarKey={match.customAvatarKey}
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
            <h2 className="mm-profile-name mt-2 font-semibold">{match.fullName}</h2>
            <p className="mt-2 text-sm font-medium text-muted">
              {match.facultyName} · {match.academicProgramName} · Year{" "}
              {match.yearOfStudy}
            </p>
          </div>
        </div>
        <Link
          className="mm-button inline-flex items-center justify-center rounded-full border border-border px-4 font-semibold transition hover:border-primary"
          href={`/profiles/${match.userId}`}
        >
          View profile
        </Link>
      </header>

      <p className="mt-4 text-sm leading-5 text-muted">{match.bio || "No bio yet."}</p>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section>
          <h3 className="text-sm font-semibold">Can offer</h3>
          <div className="mt-2.5">
            <TaxonomyChipList items={match.offeredSkills} showCategory />
          </div>
        </section>
        <section>
          <h3 className="text-sm font-semibold">Looking for</h3>
          <div className="mt-2.5">
            <TaxonomyChipList
              emptyLabel="No looking-for skills listed."
              items={match.lookingForSkills}
              showCategory
            />
          </div>
        </section>
      </div>

      {match.canDirectContact ? (
        <div className="mt-5 border-t border-border pt-4">
          <ContactReveal targetUserId={match.userId} />
        </div>
      ) : null}
    </article>
  );
}
