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
      benefitsDividers
      benefits={[
        {
          description: "Meet like-minded students",
          icon: <UsersIcon className="mm-icon" />,
          title: "",
        },
        {
          description: "Find project teammates",
          icon: <BoltIcon className="mm-icon" />,
          title: "",
        },
        {
          description: "Turn ideas into real projects",
          icon: <BarChartIcon className="mm-icon" />,
          title: "",
        },
      ]}
      subtitle="Become part of the Mohyla student network. Find people, share ideas, and build something together."
      title="Join Mohyla Match"
    >
      <section className="mt-5 rounded-2xl border border-[#dce7f7] bg-white/92 p-5 shadow-[0_18px_50px_rgba(37,76,139,0.11)] backdrop-blur">
        <form action="/auth/signup" className="space-y-4" method="post">
          <AuthMessage message={message} />
          <AuthField
            helper="Your name as it appears at NaUKMA"
            icon={<UserIcon className="mm-icon" />}
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
            helper="Use your @ukma.edu.ua student email"
            icon={<MailIcon className="mm-icon" />}
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
            className="mm-button inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-[#3154b8] px-6 font-bold text-white transition hover:bg-[#27469f] disabled:cursor-not-allowed disabled:opacity-70"
            pendingLabel="Creating account..."
          >
            Join Mohyla Match
            <ArrowRightIcon className="mm-icon" />
          </AuthSubmitButton>
        </form>
        <div className="mt-4 flex items-center gap-4 text-xs font-semibold text-[#344268] sm:text-[0.8125rem]">
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
