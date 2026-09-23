import Link from "next/link";
import { notFound } from "next/navigation";

import { ProfileEditForm } from "@/components/profile/profile-edit-form";
import { SystemAvatar } from "@/components/profile/system-avatar";
import { requireAccountState } from "@/lib/auth/guards";
import { loadProfileEditData } from "@/lib/profile/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Edit Profile",
};

type PageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
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

function EditorTopBar({
  fullName,
  systemAvatarKey,
}: Readonly<{
  fullName: string;
  systemAvatarKey: string;
}>) {
  return (
    <header className="border-b border-blue-100 bg-white/85 px-4 py-3 backdrop-blur sm:px-6">
      <div className="mx-auto flex max-w-[96rem] flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-8">
          <Link
            className="font-serif text-3xl font-bold leading-none text-blue-950"
            href="/app"
          >
            Mohyla Match
          </Link>
          <nav
            aria-label="Primary"
            className="hidden items-center gap-7 text-sm font-semibold text-blue-900 lg:flex"
          >
            <Link className="transition hover:text-blue-950" href="/app">
              Discover
            </Link>
            <Link className="transition hover:text-blue-950" href="/saved">
              Saved
            </Link>
            <Link className="transition hover:text-blue-950" href="/profile">
              My profile
            </Link>
          </nav>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <form action="/app" className="relative w-full sm:w-96">
            <label className="sr-only" htmlFor="profile-edit-search">
              Search students, skills or interests
            </label>
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-blue-500">
              <SearchIcon />
            </span>
            <input
              className="h-11 w-full rounded-md border border-blue-100 bg-blue-50/80 pl-12 pr-5 text-sm font-medium text-blue-950 outline-none transition placeholder:text-blue-400 focus:border-blue-300 focus:bg-white"
              id="profile-edit-search"
              name="q"
              placeholder="Search students, skills or interests..."
              type="search"
            />
          </form>
          <Link
            className="inline-flex items-center gap-3 rounded-lg px-2 py-1.5 text-blue-950 transition hover:bg-blue-50"
            href="/profile"
          >
            <SystemAvatar
              fullName={fullName}
              size="sm"
              systemAvatarKey={systemAvatarKey}
            />
            <span className="text-left">
              <span className="block text-sm font-semibold">{fullName}</span>
              <span className="block text-xs text-slate-500">My profile</span>
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default async function EditProfilePage({ searchParams }: PageProps) {
  const accountState = await requireAccountState("/profile/edit", ["active"]);
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const profileData = await loadProfileEditData(
    supabase,
    accountState.userId ?? "",
  );

  if (profileData.error) {
    return (
      <main className="min-h-screen bg-[#eef6fb] px-5 py-8 text-blue-950">
        <section className="mx-auto w-full max-w-3xl rounded-lg border border-blue-100 bg-white p-6 shadow-sm">
          <Link href="/profile" className="text-sm font-semibold text-blue-700">
            Mohyla Match
          </Link>
          <h1 className="mt-8 font-serif text-4xl font-semibold">
            Editor unavailable
          </h1>
          <p className="mt-3 leading-7 text-blue-900/70">
            We could not load profile editing data. Try again in a moment.
          </p>
        </section>
      </main>
    );
  }

  if (!profileData.data) {
    notFound();
  }

  const error = firstParam(params.error);

  return (
    <main className="min-h-screen bg-[#eef6fb] text-blue-950">
      <EditorTopBar
        fullName={profileData.data.profile.full_name}
        systemAvatarKey={profileData.data.profile.system_avatar_key}
      />
      <section className="mx-auto w-full max-w-[96rem] px-4 py-6 sm:px-6 lg:py-8">
        <ProfileEditForm data={profileData.data} error={error} />
      </section>
    </main>
  );
}
