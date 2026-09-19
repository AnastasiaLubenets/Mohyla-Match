import Link from "next/link";

export const metadata = {
  title: "Auth error",
};

type AuthErrorPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string | null {
  const value = params[key];
  return typeof value === "string" ? value : null;
}

export default async function AuthErrorPage({
  searchParams,
}: AuthErrorPageProps) {
  const params = searchParams ? await searchParams : {};
  const reason = readParam(params, "reason");
  const message =
    reason === "invalid-link"
      ? "This confirmation link is incomplete or expired."
      : "We could not confirm this email address.";

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <section className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-sm">
        <Link href="/" className="text-sm font-semibold text-primary">
          Mohyla Match
        </Link>
        <h1 className="mt-8 text-3xl font-semibold">Confirmation failed</h1>
        <p className="mt-3 leading-7 text-muted">{message}</p>
        <Link
          href="/login"
          className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-full bg-primary px-5 font-semibold text-white transition hover:bg-primary-strong"
        >
          Return to login
        </Link>
      </section>
    </main>
  );
}
