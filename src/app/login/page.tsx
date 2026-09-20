import Link from "next/link";

import { AuthSubmitButton } from "@/components/auth-submit-button";
import { sanitizeNextPath } from "@/lib/auth/routing";

export const metadata = {
  title: "Login",
};

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string | null {
  const value = params[key];
  return typeof value === "string" ? value : null;
}

function loginMessage(error: string | null, status: string | null) {
  if (status === "signed-out") {
    return {
      tone: "success",
      text: "You have been logged out.",
    };
  }

  if (status === "already-registered") {
    return {
      tone: "success",
      text: "This account already exists. Log in to continue.",
    };
  }

  if (error === "missing") {
    return {
      tone: "error",
      text: "Enter your email and password.",
    };
  }

  if (error === "invalid") {
    return {
      tone: "error",
      text: "Email or password is incorrect, or the email is not confirmed yet.",
    };
  }

  return null;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : {};
  const nextPath = sanitizeNextPath(readParam(params, "next"));
  const message = loginMessage(readParam(params, "error"), readParam(params, "status"));

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <section className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-sm">
        <Link href="/" className="text-sm font-semibold text-primary">
          Mohyla Match
        </Link>
        <h1 className="mt-8 text-3xl font-semibold">Login</h1>
        <p className="mt-3 leading-7 text-muted">
          Corporate email access for verified Mohyla students.
        </p>
        {message ? (
          <p
            className={`mt-6 rounded-md border px-4 py-3 text-sm ${
              message.tone === "success"
                ? "border-primary/30 bg-primary/5 text-primary"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {message.text}
          </p>
        ) : null}
        <form action="/auth/login" className="mt-8 space-y-4" method="post">
          <input name="next" type="hidden" value={nextPath} />
          <input
            autoComplete="email"
            className="h-12 w-full rounded-md border border-border bg-background px-4 text-base outline-none transition focus:border-primary"
            name="email"
            required
            type="email"
            placeholder="student@domain"
          />
          <input
            autoComplete="current-password"
            className="h-12 w-full rounded-md border border-border bg-background px-4 text-base outline-none transition focus:border-primary"
            minLength={6}
            name="password"
            placeholder="Password"
            required
            type="password"
          />
          <AuthSubmitButton pendingLabel="Logging in...">Login</AuthSubmitButton>
        </form>
        <p className="mt-6 text-sm text-muted">
          Need an account?{" "}
          <Link className="font-semibold text-primary" href="/signup">
            Join Mohyla Match
          </Link>
        </p>
      </section>
    </main>
  );
}
