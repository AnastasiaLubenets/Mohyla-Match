import Link from "next/link";

import { AuthSubmitButton } from "@/components/auth-submit-button";

export const metadata = {
  title: "Sign up",
};

type SignupPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string | null {
  const value = params[key];
  return typeof value === "string" ? value : null;
}

function signupMessage(error: string | null, status: string | null) {
  if (status === "check-email") {
    return {
      tone: "success",
      text: "Check your inbox and confirm your email to continue.",
    };
  }

  if (error === "domain") {
    return {
      tone: "error",
      text: "This email domain is not enabled for Mohyla Match yet.",
    };
  }

  if (error === "match") {
    return {
      tone: "error",
      text: "The passwords do not match.",
    };
  }

  if (error === "missing") {
    return {
      tone: "error",
      text: "Enter an email and password.",
    };
  }

  if (error === "password") {
    return {
      tone: "error",
      text: "Choose a stronger password.",
    };
  }

  if (error === "signup") {
    return {
      tone: "error",
      text: "Signup could not be completed.",
    };
  }

  return null;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = searchParams ? await searchParams : {};
  const message = signupMessage(readParam(params, "error"), readParam(params, "status"));

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <section className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-sm">
        <Link href="/" className="text-sm font-semibold text-primary">
          Mohyla Match
        </Link>
        <h1 className="mt-8 text-3xl font-semibold">Join Mohyla Match</h1>
        <p className="mt-3 leading-7 text-muted">
          Sign up with a verified corporate student email.
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
        <form action="/auth/signup" className="mt-8 space-y-4" method="post">
          <input
            autoComplete="email"
            className="h-12 w-full rounded-md border border-border bg-background px-4 text-base outline-none transition focus:border-primary"
            name="email"
            required
            type="email"
            placeholder="student@domain"
          />
          <input
            autoComplete="new-password"
            className="h-12 w-full rounded-md border border-border bg-background px-4 text-base outline-none transition focus:border-primary"
            minLength={6}
            name="password"
            placeholder="Password"
            required
            type="password"
          />
          <input
            autoComplete="new-password"
            className="h-12 w-full rounded-md border border-border bg-background px-4 text-base outline-none transition focus:border-primary"
            minLength={6}
            name="password_confirmation"
            placeholder="Confirm password"
            required
            type="password"
          />
          <AuthSubmitButton pendingLabel="Requesting access...">
            Request access
          </AuthSubmitButton>
        </form>
        <p className="mt-6 text-sm text-muted">
          Already registered?{" "}
          <Link className="font-semibold text-primary" href="/login">
            Login
          </Link>
        </p>
      </section>
    </main>
  );
}
