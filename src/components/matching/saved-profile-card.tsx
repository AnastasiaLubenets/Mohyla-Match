import Link from "next/link";

import { ContactReveal } from "@/components/matching/contact-reveal";
import { SaveProfileButton } from "@/components/matching/save-profile-button";
import { TaxonomyChipList } from "@/components/matching/taxonomy-chip-list";
import { SystemAvatar } from "@/components/profile/system-avatar";
import type { SavedProfileSummary } from "@/lib/matching/data";

export function SavedProfileCard({
  profile,
}: Readonly<{ profile: SavedProfileSummary }>) {
  return (
    <article className="rounded-lg border border-border bg-surface p-5 shadow-sm sm:p-6">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <SystemAvatar
            availability={profile.availability}
            facultyName={profile.facultyName}
            fullName={profile.fullName}
            programName={profile.academicProgramName}
            size="md"
            systemAvatarKey={profile.systemAvatarKey}
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">
              Saved profile
            </p>
            <h2 className="mt-2 text-2xl font-semibold">{profile.fullName}</h2>
            <p className="mt-2 text-sm font-medium text-muted">
              {profile.facultyName} · {profile.academicProgramName} · Year{" "}
              {profile.yearOfStudy}
            </p>
          </div>
        </div>
        <SaveProfileButton
          label="Remove from saved"
          pendingLabel="Removing..."
          returnTo="/saved"
          saved
          targetUserId={profile.userId}
        />
      </header>

      <p className="mt-5 leading-7 text-muted">
        {profile.bio || "No bio yet."}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section>
          <h3 className="text-sm font-semibold">Can offer</h3>
          <div className="mt-3">
            <TaxonomyChipList items={profile.offeredSkills} showCategory />
          </div>
        </section>
        <section>
          <h3 className="text-sm font-semibold">Looking for</h3>
          <div className="mt-3">
            <TaxonomyChipList
              emptyLabel="No looking-for skills listed."
              items={profile.lookingForSkills}
              showCategory
            />
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-3 border-t border-border pt-5 sm:grid-cols-2">
        <Link
          className="inline-flex h-11 items-center justify-center rounded-full border border-border px-4 text-sm font-semibold transition hover:border-primary"
          href={`/profiles/${profile.userId}`}
        >
          View profile
        </Link>
        {profile.canDirectContact ? (
          <ContactReveal targetUserId={profile.userId} />
        ) : null}
      </div>
    </article>
  );
}
