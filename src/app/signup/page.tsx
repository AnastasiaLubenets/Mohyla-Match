import Link from "next/link";

import { AuthField, AuthMessage } from "@/components/auth/auth-field";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { AuthSubmitButton } from "@/components/auth-submit-button";
import { PasswordField } from "@/components/auth/password-field";
import {
  ArrowRightIcon,
  BarChartIcon,
  BoltIcon,
  MailIcon,
  UserIcon,
  UsersIcon,
} from "@/components/public/public-icons";

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

type AuthPageMessage = {
  tone: "error" | "success";
  text: string;
};

function signupMessage(
  error: string | null,
  status: string | null,
): AuthPageMessage | null {
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
      text: "Enter your full name, student email, and password.",
    };
  }

  if (error === "full-name") {
    return {
      tone: "error",
      text: "Enter your full name.",
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
    <AuthPageShell
      active="signup"
      benefits={[
        {
          description: "Meet like-minded students",
          icon: <UsersIcon className="h-5 w-5" />,
          title: "",
        },
        {
          description: "Find project teammates",
          icon: <BoltIcon className="h-5 w-5" />,
          title: "",
        },
        {
          description: "Turn ideas into real projects",
          icon: <BarChartIcon className="h-5 w-5" />,
          title: "",
        },
      ]}
      subtitle="Become part of the Mohyla student network. Find people, share ideas, and build something together."
      title="Join Mohyla Match"
    >
      <section className="mt-7 rounded-[1.35rem] border border-[#dce7f7] bg-white/92 p-5 shadow-[0_18px_50px_rgba(37,76,139,0.11)] backdrop-blur sm:p-7">
        <form action="/auth/signup" className="space-y-5" method="post">
          <AuthMessage message={message} />
          <AuthField
            helper="Your name as it appears at NaUKMA"
            icon={<UserIcon className="h-5 w-5" />}
            inputProps={{
              autoComplete: "name",
              maxLength: 120,
              name: "full_name",
              placeholder: "Full name",
              required: true,
            }}
            label="Full name"
            name="full_name"
          />
          <AuthField
            addon={
              <span className="hidden rounded-full bg-[#edf4ff] px-3 py-1 text-sm font-bold text-[#174ca7] sm:inline-block">
                @ukma.edu.ua
              </span>
            }
            helper="Use your @ukma.edu.ua student email"
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
            autoComplete="new-password"
            helper="At least 6 characters"
            label="Password"
            name="password"
          />
          <PasswordField
            autoComplete="new-password"
            helper="Re-enter your password"
            label="Confirm password"
            name="password_confirmation"
          />
          <AuthSubmitButton
            className="inline-flex h-16 w-full items-center justify-center gap-4 rounded-full bg-[#3154b8] px-8 text-lg font-bold text-white transition hover:bg-[#27469f] disabled:cursor-not-allowed disabled:opacity-70"
            pendingLabel="Creating account..."
          >
            Join Mohyla Match
            <ArrowRightIcon className="h-6 w-6" />
          </AuthSubmitButton>
        </form>
        <div className="mt-5 flex items-center gap-5 text-sm font-semibold text-[#344268]">
          <span className="h-px flex-1 bg-[#dce7f7]" />
          <p>
            Already have an account?{" "}
            <Link className="text-[#174ca7] transition hover:text-[#101b55]" href="/login">
              Login
            </Link>
          </p>
          <span className="h-px flex-1 bg-[#dce7f7]" />
        </div>
      </section>
    </AuthPageShell>
  );
}
