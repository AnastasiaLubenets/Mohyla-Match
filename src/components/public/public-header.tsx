import Link from "next/link";

type PublicHeaderProps = Readonly<{
  active?: "landing" | "login" | "signup";
  layout?: "auth" | "landing";
}>;

const headerLayoutClasses = {
  auth: "flex w-full items-center justify-between gap-4 px-5 py-6 sm:px-8 lg:px-[clamp(4.5rem,7vw,12rem)]",
  landing:
    "mx-auto flex w-full max-w-[1800px] items-center justify-between gap-4 px-5 py-6 sm:px-8 lg:px-12 xl:px-[clamp(5rem,4vw,6rem)]",
} as const;

export function PublicHeader({
  active = "landing",
  layout = "landing",
}: PublicHeaderProps) {
  return (
    <header className="relative z-20">
      <div className={headerLayoutClasses[layout]}>
        <Link
          href="/"
          className="text-[0.92rem] font-bold uppercase tracking-[0.14em] text-[#173f95] transition hover:text-[#101b55] sm:text-base"
        >
          Mohyla Match
        </Link>
        <nav className="flex items-center gap-5 text-sm font-bold text-[#070d35] sm:gap-7 sm:text-base">
          <Link
            href="/login"
            className={`rounded-sm transition hover:text-[#3154b8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3154b8] ${
              active === "login"
                ? "border-b-2 border-[#3154b8] pb-1 text-[#070d35]"
                : ""
            }`}
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-12 items-center justify-center rounded-full bg-[#3154b8] px-7 font-bold text-white transition hover:bg-[#27469f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3154b8] sm:min-w-28"
            aria-current={active === "signup" ? "page" : undefined}
          >
            Join
          </Link>
        </nav>
      </div>
    </header>
  );
}
