import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AuthSubmitButton } from "@/components/auth-submit-button";
import { OnboardingSkillPicker } from "@/components/onboarding-skill-picker";
import { OnboardingBasicForm } from "@/components/onboarding-basic-form";
import { destinationForAccountState } from "@/lib/auth/routing";
import { normalizeSignupFullName } from "@/lib/auth/signup";
import { getCurrentAccountState } from "@/lib/auth/state";
import {
  canVisitOnboardingStep,
  getCompletedOnboardingStepCount,
  getFirstIncompleteOnboardingStep,
  onboardingStepCount,
  parseOnboardingStep,
  type OnboardingStep,
} from "@/lib/onboarding/progress";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Account setup",
};

type PageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

type FacultyOption = Readonly<{
  id: number;
  display_name: string;
}>;

type ProgramOption = Readonly<{
  id: number;
  faculty_id: number;
  display_name: string;
}>;

type SkillOption = Readonly<{
  id: number;
  category: string;
  is_featured: boolean;
  name: string;
  search_aliases: string[];
}>;

type NamedOption = Readonly<{
  id: number;
  name: string;
}>;

type ProfileValue = Readonly<{
  full_name: string;
  faculty_id: number;
  academic_program_id: number;
  year_of_study: number;
  bio: string | null;
  availability: string | null;
}>;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function ProgressHeader({
  completedSteps,
  step,
}: Readonly<{
  completedSteps: number;
  step: OnboardingStep;
}>) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.08em] text-primary">
        Step {step} of {onboardingStepCount}
      </p>
      <div className="mt-4 grid grid-cols-4 gap-2" aria-hidden="true">
        {[1, 2, 3, 4].map((item) => (
          <span
            className={`h-2 rounded-full ${
              item <= Math.max(step, completedSteps)
                ? "bg-primary"
                : "bg-surface-strong"
            }`}
            key={item}
          />
        ))}
      </div>
    </div>
  );
}

function ErrorMessage({ message }: Readonly<{ message?: string }>) {
  if (!message) {
    return null;
  }

  return (
    <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-900">
      {message}
    </div>
  );
}

function ChoiceCard({
  defaultChecked,
  fieldName,
  id,
  name,
}: Readonly<{
  defaultChecked: boolean;
  fieldName: string;
  id: number;
  name: string;
}>) {
  const inputId = `${fieldName}-${id}`;

  return (
    <div>
      <input
        className="peer sr-only"
        defaultChecked={defaultChecked}
        id={inputId}
        name={fieldName}
        type="checkbox"
        value={id}
      />
      <label
        className="flex min-h-12 cursor-pointer items-center rounded-lg border border-border bg-surface px-4 py-3 text-sm font-semibold transition peer-checked:border-primary peer-checked:bg-surface-strong peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary"
        htmlFor={inputId}
      >
        {name}
      </label>
    </div>
  );
}

function FormNavigation({
  backHref,
  children = "Continue",
  pendingLabel,
}: Readonly<{
  backHref: string;
  children?: ReactNode;
  pendingLabel: string;
}>) {
  return (
    <div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row sm:items-center sm:justify-between">
      <Link
        className="inline-flex h-12 items-center justify-center rounded-full border border-border px-5 text-sm font-semibold text-foreground transition hover:border-primary"
        href={backHref}
      >
        Back
      </Link>
      <div className="sm:w-52">
        <AuthSubmitButton pendingLabel={pendingLabel}>{children}</AuthSubmitButton>
      </div>
    </div>
  );
}

function SkillStep({
  action,
  backHref,
  defaultSkillIds,
  description,
  fieldName,
  isOptional = false,
  skills,
  title,
}: Readonly<{
  action: string;
  backHref: string;
  defaultSkillIds: Set<number>;
  description: string;
  fieldName: string;
  isOptional?: boolean;
  skills: SkillOption[];
  title: string;
}>) {
  return (
    <OnboardingSkillPicker
      action={action}
      backHref={backHref}
      defaultSkillIds={[...defaultSkillIds]}
      description={description}
      fieldName={fieldName}
      isOptional={isOptional}
      skills={skills}
      title={title}
    />
  );
}

function BuildStep({
  collaborationGoals,
  defaultCollaborationGoalIds,
  defaultInterestIds,
  interests,
}: Readonly<{
  collaborationGoals: NamedOption[];
  defaultCollaborationGoalIds: Set<number>;
  defaultInterestIds: Set<number>;
  interests: NamedOption[];
}>) {
  return (
    <form action="/account/setup/build" className="mt-8 space-y-7" method="post">
      <div>
        <h1 className="text-3xl font-semibold">What do you want to build?</h1>
        <p className="mt-3 leading-7 text-muted">
          Choose interests and collaboration goals if you already know what you
          want to explore, or skip this for now.
        </p>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">Interests · Optional</legend>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {interests.map((interest) => (
            <ChoiceCard
              defaultChecked={defaultInterestIds.has(interest.id)}
              fieldName="interestId"
              id={interest.id}
              key={interest.id}
              name={interest.name}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">
          Collaboration goals · Optional
        </legend>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {collaborationGoals.map((goal) => (
            <ChoiceCard
              defaultChecked={defaultCollaborationGoalIds.has(goal.id)}
              fieldName="collaborationGoalId"
              id={goal.id}
              key={goal.id}
              name={goal.name}
            />
          ))}
        </div>
      </fieldset>

      <FormNavigation
        backHref="/account/setup?step=3"
        pendingLabel="Completing..."
      >
        Finish onboarding
      </FormNavigation>
      <div className="flex justify-end">
        <button
          className="text-sm font-semibold text-muted transition hover:text-foreground"
          name="skip"
          type="submit"
          value="true"
        >
          Skip for now
        </button>
      </div>
    </form>
  );
}

export default async function AccountSetupPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const accountState = await getCurrentAccountState(supabase);

  if (accountState.state !== "onboarding_incomplete" || !accountState.userId) {
    redirect(destinationForAccountState(accountState.state, "/account/setup"));
  }

  const [
    facultiesResult,
    programsResult,
    skillsResult,
    interestsResult,
    goalsResult,
    profileResult,
    profileSkillsResult,
    profileInterestsResult,
    profileGoalsResult,
    userResult,
  ] = await Promise.all([
    supabase
      .from("faculties")
      .select("id,display_name")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("display_name", { ascending: true }),
    supabase
      .from("academic_programs")
      .select("id,faculty_id,display_name")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("display_name", { ascending: true }),
    supabase
      .from("skills")
      .select("id,category,is_featured,name,search_aliases")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("interests")
      .select("id,name")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("collaboration_goals")
      .select("id,name")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("profiles")
      .select(
        "full_name,faculty_id,academic_program_id,year_of_study,bio,availability",
      )
      .eq("user_id", accountState.userId)
      .maybeSingle(),
    supabase
      .from("profile_skills")
      .select("skill_id,direction")
      .eq("user_id", accountState.userId),
    supabase
      .from("profile_interests")
      .select("interest_id")
      .eq("user_id", accountState.userId),
    supabase
      .from("profile_collaboration_goals")
      .select("collaboration_goal_id")
      .eq("user_id", accountState.userId),
    supabase.auth.getUser(),
  ]);

  const loadError = [
    facultiesResult.error,
    programsResult.error,
    skillsResult.error,
    interestsResult.error,
    goalsResult.error,
    profileResult.error,
    profileSkillsResult.error,
    profileInterestsResult.error,
    profileGoalsResult.error,
  ].find(Boolean);

  if (loadError) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5 py-10">
        <section className="w-full max-w-lg rounded-lg border border-border bg-surface p-6 shadow-sm">
          <Link href="/" className="text-sm font-semibold text-primary">
            Mohyla Match
          </Link>
          <h1 className="mt-8 text-3xl font-semibold">Setup unavailable</h1>
          <p className="mt-3 leading-7 text-muted">
            We could not load the setup data. Try again in a moment.
          </p>
        </section>
      </main>
    );
  }

  const profile = (profileResult.data ?? null) as ProfileValue | null;
  const suggestedFullName = profile
    ? null
    : normalizeSignupFullName(userResult.data.user?.user_metadata?.full_name);
  const profileSkills = profileSkillsResult.data ?? [];
  const offerSkillIds = new Set(
    profileSkills
      .filter((skill) => skill.direction === "offer")
      .map((skill) => skill.skill_id),
  );
  const lookingForSkillIds = new Set(
    profileSkills
      .filter((skill) => skill.direction === "looking_for")
      .map((skill) => skill.skill_id),
  );
  const interestIds = new Set(
    (profileInterestsResult.data ?? []).map((interest) => interest.interest_id),
  );
  const collaborationGoalIds = new Set(
    (profileGoalsResult.data ?? []).map((goal) => goal.collaboration_goal_id),
  );
  const progress = {
    hasBasicProfile: Boolean(profile),
    offerSkillCount: offerSkillIds.size,
    lookingForSkillCount: lookingForSkillIds.size,
    interestCount: interestIds.size,
    collaborationGoalCount: collaborationGoalIds.size,
  };
  const firstIncompleteStep = getFirstIncompleteOnboardingStep(progress);
  const requestedStep = parseOnboardingStep(firstParam(params.step));
  const defaultStep = firstIncompleteStep ?? 4;

  if (!requestedStep) {
    redirect(`/account/setup?step=${defaultStep}`);
  }

  if (!canVisitOnboardingStep(requestedStep, firstIncompleteStep)) {
    redirect(`/account/setup?step=${defaultStep}`);
  }

  const error = firstParam(params.error);
  const completedSteps = getCompletedOnboardingStepCount(progress);
  let stepContent: ReactNode;

  if (requestedStep === 1) {
    stepContent = (
      <>
        <div className="mt-8">
          <h1 className="text-3xl font-semibold">Basic profile</h1>
          <p className="mt-3 leading-7 text-muted">
            Tell collaborators who you are. Your student email is already
            linked to your account and is not part of this form.
          </p>
        </div>
        <OnboardingBasicForm
          faculties={(facultiesResult.data ?? []) as FacultyOption[]}
          programs={(programsResult.data ?? []) as ProgramOption[]}
          profile={profile}
          suggestedFullName={suggestedFullName}
        />
      </>
    );
  } else if (requestedStep === 2) {
    stepContent = (
      <SkillStep
        action="/account/setup/offer"
        backHref="/account/setup?step=1"
        defaultSkillIds={offerSkillIds}
        description="Choose at least one skill you can bring to another student's project."
        fieldName="skillId"
        skills={(skillsResult.data ?? []) as SkillOption[]}
        title="What can you offer?"
      />
    );
  } else if (requestedStep === 3) {
    stepContent = (
      <SkillStep
        action="/account/setup/looking-for"
        backHref="/account/setup?step=2"
        defaultSkillIds={lookingForSkillIds}
        description="Choose skills you would like to find in collaborators, or skip this for now."
        fieldName="skillId"
        isOptional
        skills={(skillsResult.data ?? []) as SkillOption[]}
        title="What are you looking for?"
      />
    );
  } else {
    stepContent = (
      <BuildStep
        collaborationGoals={(goalsResult.data ?? []) as NamedOption[]}
        defaultCollaborationGoalIds={collaborationGoalIds}
        defaultInterestIds={interestIds}
        interests={(interestsResult.data ?? []) as NamedOption[]}
      />
    );
  }

  return (
    <main className="min-h-screen px-5 py-6 sm:px-8 sm:py-8">
      <section className="mx-auto w-full max-w-4xl">
        <nav className="mb-6 flex items-center justify-between gap-4">
          <Link href="/" className="text-sm font-semibold text-primary">
            Mohyla Match
          </Link>
          <form action="/auth/logout" method="post">
            <button
              className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground transition hover:border-primary"
              type="submit"
            >
              Logout
            </button>
          </form>
        </nav>

        <div className="rounded-lg border border-border bg-surface p-5 shadow-sm sm:p-8">
          <ProgressHeader completedSteps={completedSteps} step={requestedStep} />
          <ErrorMessage message={error} />
          {stepContent}
        </div>
      </section>
    </main>
  );
}
