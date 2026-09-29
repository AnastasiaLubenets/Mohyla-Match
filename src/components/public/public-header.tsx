import Link from "next/link";

type PublicHeaderProps = Readonly<{
  active?: "landing" | "login" | "signup";
}>;

const headerLayoutClassName =
  "mx-auto flex w-full max-w-[1800px] items-center justify-between gap-4 px-5 py-6 sm:px-8 lg:px-12 xl:px-[clamp(5rem,4vw,6rem)]";

export function PublicHeader({ active = "landing" }: PublicHeaderProps) {
  return (
    <header className="relative z-20 w-screen">
      <div className={headerLayoutClassName}>
        <Link
          href="/"
          className="text-[0.92rem] font-bold uppercase tracking-[0.14em] text-[#173f95] transition hover:text-[#101b55] sm:text-base"
        >
          Mohyla Match
        </Link>
        <nav className="flex items-center gap-5 text-sm font-bold text-[#070d35] sm:gap-7 sm:text-base">
          <Link
            href="/login"
            className={`relative rounded-sm transition after:absolute after:left-0 after:right-0 after:-bottom-1 after:h-0.5 after:rounded-full hover:text-[#3154b8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3154b8] ${
              active === "login"
                ? "text-[#070d35] after:bg-[#3154b8]"
                : "after:bg-transparent"
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
