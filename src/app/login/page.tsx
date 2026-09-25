import Link from "next/link";

import { AuthField, AuthMessage } from "@/components/auth/auth-field";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { AuthSubmitButton } from "@/components/auth-submit-button";
import { PasswordField } from "@/components/auth/password-field";
import {
  ArrowRightIcon,
  BarChartIcon,
  BoltIcon,
  LockIcon,
  MailIcon,
  UsersIcon,
} from "@/components/public/public-icons";
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

type AuthPageMessage = {
  tone: "error" | "success";
  text: string;
};

function loginMessage(
  error: string | null,
  status: string | null,
): AuthPageMessage | null {
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
      text: "Email or password is incorrect.",
    };
  }

  return null;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : {};
  const nextPath = sanitizeNextPath(readParam(params, "next"));
  const message = loginMessage(readParam(params, "error"), readParam(params, "status"));

  return (
    <AuthPageShell
      active="login"
      badgeIcon={<LockIcon className="h-4 w-4" />}
      benefits={[
        {
          description: "Find collaborators",
          icon: <UsersIcon className="h-5 w-5" />,
          title: "",
        },
        {
          description: "Return to saved profiles",
          icon: <BoltIcon className="h-5 w-5" />,
          title: "",
        },
        {
          description: "Keep building",
          icon: <BarChartIcon className="h-5 w-5" />,
          title: "",
        },
      ]}
      subtitle="Log in to reconnect with the Mohyla student network. Find people and keep building together."
      title="Welcome back"
    >
      <section className="mt-7 rounded-[1.35rem] border border-[#dce7f7] bg-white/92 p-5 shadow-[0_18px_50px_rgba(37,76,139,0.11)] backdrop-blur sm:p-7">
        <form action="/auth/login" className="space-y-5" method="post">
          <input name="next" type="hidden" value={nextPath} />
          <AuthMessage message={message} />
          <AuthField
            addon={
              <span className="hidden rounded-full bg-[#edf4ff] px-3 py-1 text-sm font-bold text-[#174ca7] sm:inline-block">
                @ukma.edu.ua
              </span>
            }
            helper="Use your NaUKMA student email"
            icon={<MailIcon className="h-5 w-5" />}
            inputProps={{
              autoComplete: "email",
              name: "email",
              placeholder: "Student email",
              required: true,
            }}
            label="Student email"
            name="email"
            type="email"
          />
          <PasswordField
            autoComplete="current-password"
            helper="Enter your password"
            label="Password"
            name="password"
          />
          <AuthSubmitButton
            className="inline-flex h-16 w-full items-center justify-center gap-4 rounded-full bg-[#3154b8] px-8 text-lg font-bold text-white transition hover:bg-[#27469f] disabled:cursor-not-allowed disabled:opacity-70"
            pendingLabel="Logging in..."
          >
            Login
            <ArrowRightIcon className="h-6 w-6" />
          </AuthSubmitButton>
        </form>
        <div className="mt-5 flex items-center gap-5 text-sm font-semibold text-[#344268]">
          <span className="h-px flex-1 bg-[#dce7f7]" />
          <p>
            New here?{" "}
            <Link className="text-[#174ca7] transition hover:text-[#101b55]" href="/signup">
              Join Mohyla Match
            </Link>
          </p>
          <span className="h-px flex-1 bg-[#dce7f7]" />
        </div>
      </section>
    </AuthPageShell>
  );
}
