import Link from "next/link";
import type { ReactNode } from "react";

import { SystemAvatar } from "@/components/profile/system-avatar";
import type { SafeProfile } from "@/lib/profile/data";

type NavKey = "discover" | "profile" | "saved";

type AppChromeProps = Readonly<{
  active: NavKey;
  children: ReactNode;
  currentProfile: SafeProfile | null;
}>;

type SidebarLinkProps = Readonly<{
  active?: boolean;
  children: ReactNode;
  href: string;
  label: string;
}>;

function CompassIcon() {
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
      <circle cx="12" cy="12" r="9" />
      <path d="m15 9-2 5-5 2 2-5 5-2Z" />
    </svg>
  );
}

function BookmarkIcon() {
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
      <path d="M19 21 12 16 5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z" />
    </svg>
  );
}

function UserIcon() {
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
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="8" r="4" />
    </svg>
  );
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

function SidebarLink({ active = false, children, href, label }: SidebarLinkProps) {
  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "inline-flex items-center gap-4 rounded-md bg-blue-100/90 px-5 py-4 text-sm font-bold text-blue-950 shadow-sm"
          : "inline-flex items-center gap-4 rounded-md px-5 py-4 text-sm font-bold text-blue-900 transition hover:bg-blue-50"
      }
      href={href}
    >
      {children}
      <span>{label}</span>
    </Link>
  );
}

function AppSidebar({ active }: Readonly<{ active: NavKey }>) {
  return (
    <aside className="border-b border-blue-100 bg-white/90 px-4 py-4 backdrop-blur xl:flex xl:h-screen xl:min-h-0 xl:flex-col xl:overflow-hidden xl:border-b-0 xl:border-r xl:px-5 xl:py-5 2xl:py-6">
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border border-blue-200 bg-blue-50 font-serif text-3xl font-bold leading-none text-blue-900">
          M
        </div>
        <div>
          <Link
            className="font-serif text-3xl font-bold uppercase leading-[0.82] text-blue-950"
            href="/app"
          >
            Mohyla
            <br />
            Match
          </Link>
          <p className="mt-2 text-[0.6rem] font-bold uppercase tracking-[0.16em] text-blue-700">
            Find people
            <br />
            Build something together
          </p>
        </div>
      </div>

      <nav className="mt-5 grid gap-2 sm:grid-cols-3 xl:grid-cols-1 2xl:mt-7">
        <SidebarLink active={active === "discover"} href="/app" label="Discover">
          <CompassIcon />
        </SidebarLink>
        <SidebarLink active={active === "saved"} href="/saved" label="Saved">
          <BookmarkIcon />
        </SidebarLink>
        <SidebarLink active={active === "profile"} href="/profile" label="My profile">
          <UserIcon />
        </SidebarLink>
      </nav>

      <div className="mt-6 hidden min-h-0 flex-1 flex-col justify-end xl:flex">
        <div className="mb-10 px-3 pb-2">
          <div className="mb-6 border-y border-blue-100 py-6 2xl:mb-8 2xl:py-8">
            <p className="font-serif text-6xl font-bold leading-none text-blue-100">
              MM
            </p>
            <div className="mt-5 grid grid-cols-3 gap-2" aria-hidden="true">
              <span className="h-px bg-blue-100" />
              <span className="h-px bg-blue-200" />
              <span className="h-px bg-blue-100" />
            </div>
          </div>
          <p className="font-serif text-3xl font-semibold uppercase leading-[0.95] text-blue-950">
            Більше
            <br />
            людей
            <br />
            Більше
            <br />
            можливостей
          </p>
          <div className="mt-6 h-px w-16 bg-blue-300" />
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-blue-500">
            Спільнота
            <br />
            що створює майбутнє
          </p>
        </div>
        <form action="/auth/logout" className="mt-5 px-3 2xl:mt-8" method="post">
          <button
            className="text-sm font-semibold text-slate-500 transition hover:text-blue-900"
            type="submit"
          >
            Log out
          </button>
        </form>
      </div>
    </aside>
  );
}

function AppTopBar({
  currentProfile,
}: Readonly<{ currentProfile: SafeProfile | null }>) {
  return (
    <header className="z-30 shrink-0 border-b border-blue-100 bg-white/80 px-4 py-3 backdrop-blur sm:px-6 xl:px-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <form action="/app" className="relative w-full lg:max-w-md">
          <label className="sr-only" htmlFor="global-search">
            Search students, skills or interests
          </label>
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-blue-500">
            <SearchIcon />
          </span>
          <input
            className="h-11 w-full rounded-lg border border-blue-100 bg-blue-50/80 pl-12 pr-5 text-sm font-medium text-blue-950 outline-none transition placeholder:text-blue-400 focus:border-blue-300 focus:bg-white"
            id="global-search"
            name="q"
            placeholder="Search students, skills or interests..."
            type="search"
          />
          <button className="sr-only" type="submit">
            Search
          </button>
        </form>

        <div className="flex items-center justify-between gap-4 lg:justify-end">
          <Link
            className="inline-flex items-center gap-3 rounded-lg px-2 py-1.5 text-blue-950 transition hover:bg-blue-50"
            href="/profile"
          >
            {currentProfile ? (
              <SystemAvatar
                availability={currentProfile.availability}
                facultyName={currentProfile.facultyName}
                fullName={currentProfile.fullName}
                programName={currentProfile.academicProgramName}
                size="sm"
                systemAvatarKey={currentProfile.systemAvatarKey}
              />
            ) : null}
            <span className="text-left">
              <span className="block text-sm font-semibold">
                {currentProfile?.fullName ?? "My profile"}
              </span>
              <span className="block text-xs text-slate-500">My profile</span>
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export function AppChrome({ active, children, currentProfile }: AppChromeProps) {
  return (
    <main className="min-h-screen bg-[#eef6fb] text-blue-950 xl:h-screen xl:overflow-hidden">
      <div className="grid min-h-screen xl:h-screen xl:min-h-0 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <AppSidebar active={active} />
        <div className="flex min-w-0 flex-col xl:h-screen xl:min-h-0 xl:overflow-hidden">
          <AppTopBar currentProfile={currentProfile} />
          <div className="min-w-0 flex-1 xl:min-h-0 xl:overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}

export function BrandQuoteCard({
  lines,
  text,
}: Readonly<{
  lines: readonly string[];
  text: string;
}>) {
  return (
    <section className="rounded-lg border border-blue-50 bg-[#fffaf0] p-7 shadow-[0_18px_50px_rgba(15,94,156,0.06)]">
      <p className="font-serif text-6xl font-bold leading-none text-blue-800">
        &quot;
      </p>
      <p className="mt-1 font-serif text-3xl font-semibold italic leading-[1.02] text-blue-950">
        {text}
      </p>
      <div className="mt-6 h-px w-16 bg-blue-300" />
      <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-blue-500">
        {lines.map((line) => (
          <span key={line}>
            {line}
            <br />
          </span>
        ))}
      </p>
    </section>
  );
}
