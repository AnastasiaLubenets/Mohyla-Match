import Link from "next/link";

export const metadata = {
  title: "Sign up",
};

export default function SignupPage() {
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
        <div className="mt-8 space-y-4">
          <input
            className="h-12 w-full rounded-md border border-border bg-background px-4 text-base outline-none"
            type="email"
            placeholder="student@domain"
            disabled
          />
          <button
            className="h-12 w-full rounded-full bg-primary px-5 font-semibold text-white opacity-70"
            disabled
          >
            Request access
          </button>
        </div>
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
