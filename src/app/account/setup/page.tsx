import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AuthSubmitButton } from "@/components/auth-submit-button";
import { OnboardingSkillPicker } from "@/components/onboarding-skill-picker";
import { OnboardingBasicForm } from "@/components/onboarding-basic-form";
import { OnboardingShell } from "@/components/onboarding-shell";
import {
  onboardingPrimaryButtonClass,
  onboardingSecondaryButtonClass,
} from "@/components/onboarding-styles";
import { destinationForAccountState } from "@/lib/auth/routing";
import { normalizeSignupFullName } from "@/lib/auth/signup";
import { getCurrentAccountState } from "@/lib/auth/state";
import {
  canVisitOnboardingStep,
  getFirstIncompleteOnboardingStep,
  parseOnboardingStep,
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
  specialty_code?: string | null;
  study_level?: "bachelor" | "master";
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

type AccountRole = "student" | "faculty";

type ProfileValue = Readonly<{
  account_role: AccountRole;
  full_name: string;
  faculty_id: number;
  academic_program_id: number;
  year_of_study: number | null;
  bio: string | null;
  availability: string | null;
}>;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
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
        className="flex min-h-12 cursor-pointer items-center gap-3 rounded-full border border-[#cddaf0] bg-white/75 px-4 py-3 text-sm font-bold text-[#102653] transition peer-checked:border-[#a9c6ee] peer-checked:bg-[#edf4ff] peer-checked:text-[#174ca7] peer-checked:[&_.choice-check]:border-[#3567a8] peer-checked:[&_.choice-check]:bg-[#3567a8] peer-checked:[&_.choice-check]:text-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#245ba2]"
        htmlFor={inputId}
      >
        <span
          className="choice-check inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-[#bed0ea] bg-white text-xs text-transparent transition"
          aria-hidden="true"
        >
          ✓
        </span>
        {name}
      </label>
    </div>
  );
}

function RoleSelection({ error }: Readonly<{ error?: string }>) {
  return (
    <OnboardingShell
      description="Choose the profile type that best describes how you will use Mohyla Match."
      error={error}
      step={1}
      title="I am a..."
    >
      <form action="/account/setup/role" className="mt-8 space-y-6" method="post">
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              description:
                "Find collaborators, save student profiles, and join student projects.",
              label: "Student",
              value: "student",
            },
            {
              description:
                "Share academic programs, expertise, and research interests in a faculty directory.",
              label: "Faculty",
              value: "faculty",
            },
          ].map((role) => (
            <label
              className="group flex cursor-pointer flex-col rounded-[1.125rem] border border-[#cddaf0] bg-white/75 p-5 transition hover:border-[#3567a8] has-[:checked]:border-[#a9c6ee] has-[:checked]:bg-[#edf4ff]"
              key={role.value}
            >
              <input
                className="sr-only"
                name="accountRole"
                required
                type="radio"
                value={role.value}
              />
              <span className="font-serif text-3xl font-bold text-[#07133f]">
                {role.label}
              </span>
              <span className="mt-3 text-sm leading-6 text-[#66769e]">
                {role.description}
              </span>
            </label>
          ))}
        </div>
        <div className="flex justify-end">
          <div className="sm:w-52">
            <AuthSubmitButton
              className={onboardingPrimaryButtonClass}
              pendingLabel="Saving..."
            >
              Continue <span aria-hidden="true">→</span>
            </AuthSubmitButton>
          </div>
        </div>
      </form>
    </OnboardingShell>
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
        className={onboardingSecondaryButtonClass}
        href={backHref}
      >
        Back
      </Link>
      <div className="sm:w-52">
        <AuthSubmitButton
          className={onboardingPrimaryButtonClass}
          pendingLabel={pendingLabel}
        >
          {children} <span aria-hidden="true">→</span>
        </AuthSubmitButton>
      </div>
    </div>
  );
}

function SkillStep({
  action,
  backHref,
  defaultSkillIds,
  emptyLabel,
  fieldName,
  isOptional = false,
  searchLabel,
  searchPlaceholder,
  skills,
  suggestedLabel,
  selectedLabel,
  title,
}: Readonly<{
  action: string;
  backHref: string;
  defaultSkillIds: Set<number>;
  emptyLabel?: string;
  fieldName: string;
  isOptional?: boolean;
  searchLabel?: string;
  searchPlaceholder?: string;
  skills: SkillOption[];
  suggestedLabel?: string;
  selectedLabel?: string;
  title: string;
}>) {
  return (
    <OnboardingSkillPicker
      action={action}
      backHref={backHref}
      defaultSkillIds={[...defaultSkillIds]}
      emptyLabel={emptyLabel}
      fieldName={fieldName}
      isOptional={isOptional}
      searchLabel={searchLabel}
      searchPlaceholder={searchPlaceholder}
      skills={skills}
      suggestedLabel={suggestedLabel}
      selectedLabel={selectedLabel}
      title={title}
    />
  );
}

function programLabel(program: ProgramOption) {
  const level = program.study_level === "master" ? "Master" : "Bachelor";
  const code = program.specialty_code ? `${program.specialty_code} · ` : "";

  return `${program.display_name} (${code}${level})`;
}

function FacultyProgramsForm({
  defaultProgramIds,
  profile,
  programs,
  suggestedFullName,
}: Readonly<{
  defaultProgramIds: Set<number>;
  profile: ProfileValue | null;
  programs: ProgramOption[];
  suggestedFullName?: string | null;
}>) {
  return (
    <form action="/account/setup/faculty-programs" className="mt-8 space-y-6" method="post">
      <label className="block">
        <span className="text-sm font-bold text-[#132a56]">
          Full name · Required
        </span>
        <input
          className="mt-2 h-12 w-full rounded-[0.875rem] border border-[#cddaf0] bg-white/80 px-4 text-sm font-semibold text-[#102653] outline-none transition placeholder:text-[#93a0bc] focus:border-[#3567a8] focus:bg-white"
          defaultValue={profile?.full_name ?? suggestedFullName ?? ""}
          maxLength={120}
          minLength={2}
          name="fullName"
          required
          type="text"
        />
      </label>

      <label className="block">
        <span className="text-sm font-bold text-[#132a56]">
          Primary academic program · Required
        </span>
        <select
          className="mt-2 h-12 w-full rounded-[0.875rem] border border-[#cddaf0] bg-white/80 px-4 text-sm font-semibold text-[#102653] outline-none transition focus:border-[#3567a8] focus:bg-white"
          defaultValue={profile?.academic_program_id ?? ""}
          name="primaryAcademicProgramId"
          required
        >
          <option disabled value="">
            Select primary program
          </option>
          {programs.map((program) => (
            <option key={program.id} value={program.id}>
              {programLabel(program)}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="space-y-3">
        <legend className="text-sm font-bold text-[#132a56]">
          Additional academic programs · Optional
        </legend>
        <div className="max-h-72 space-y-2 overflow-y-auto rounded-[0.875rem] border border-[#cddaf0] bg-white/55 p-3">
          {programs.map((program) => (
            <label
              className="flex items-start gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-[#102653] transition hover:bg-white/80"
              key={program.id}
            >
              <input
                className="mt-1 size-4 accent-[#3567a8]"
                defaultChecked={defaultProgramIds.has(program.id)}
                name="additionalAcademicProgramId"
                type="checkbox"
                value={program.id}
              />
              <span>{programLabel(program)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block">
        <span className="text-sm font-bold text-[#132a56]">Bio · Optional</span>
        <textarea
          className="mt-2 min-h-24 w-full rounded-[0.875rem] border border-[#cddaf0] bg-white/80 px-4 py-3 text-sm font-semibold text-[#102653] outline-none transition placeholder:text-[#93a0bc] focus:border-[#3567a8] focus:bg-white"
          defaultValue={profile?.bio ?? ""}
          maxLength={500}
          name="bio"
        />
      </label>

      <label className="block">
        <span className="text-sm font-bold text-[#132a56]">
          Availability · Optional
        </span>
        <input
          className="mt-2 h-12 w-full rounded-[0.875rem] border border-[#cddaf0] bg-white/80 px-4 text-sm font-semibold text-[#102653] outline-none transition placeholder:text-[#93a0bc] focus:border-[#3567a8] focus:bg-white"
          defaultValue={profile?.availability ?? ""}
          maxLength={160}
          name="availability"
          type="text"
        />
      </label>

      <FormNavigation backHref="/account/setup" pendingLabel="Saving..." />
    </form>
  );
}

function FacultyResearchStep({
  defaultInterestIds,
  interests,
}: Readonly<{
  defaultInterestIds: Set<number>;
  interests: NamedOption[];
}>) {
  return (
    <form action="/account/setup/faculty-research" className="mt-8 space-y-7" method="post">
      <fieldset className="space-y-3">
        <legend className="text-sm font-bold text-[#132a56]">
          Research interests · Optional
        </legend>
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

      <FormNavigation
        backHref="/account/setup?step=2"
        pendingLabel="Saving..."
      />
      <div className="flex justify-end">
        <button
          className="text-sm font-bold text-[#55688f] transition hover:text-[#102653] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#245ba2]"
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

function FacultyPreviewStep({
  expertiseCount,
  interestCount,
  programCount,
  profile,
}: Readonly<{
  expertiseCount: number;
  interestCount: number;
  programCount: number;
  profile: ProfileValue | null;
}>) {
  return (
    <form action="/account/setup/faculty-complete" className="mt-8 space-y-6" method="post">
      <div className="rounded-[1rem] border border-[#cddaf0] bg-white/65 p-5">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#245ba2]">
          Preview
        </p>
        <h2 className="mt-3 font-serif text-3xl font-bold text-[#07133f]">
          {profile?.full_name ?? "Faculty profile"}
        </h2>
        <dl className="mt-5 grid gap-3 text-sm text-[#66769e] sm:grid-cols-3">
          <div>
            <dt className="font-bold text-[#132a56]">Programs</dt>
            <dd>{programCount}</dd>
          </div>
          <div>
            <dt className="font-bold text-[#132a56]">Expertise</dt>
            <dd>{expertiseCount}</dd>
          </div>
          <div>
            <dt className="font-bold text-[#132a56]">Research interests</dt>
            <dd>{interestCount}</dd>
          </div>
        </dl>
      </div>

      <FormNavigation
        backHref="/account/setup?step=3"
        pendingLabel="Completing..."
      >
        Complete faculty profile
      </FormNavigation>
    </form>
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
      <fieldset className="space-y-3">
        <legend className="text-sm font-bold text-[#132a56]">
          Interests · Optional
        </legend>
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
        <legend className="text-sm font-bold text-[#132a56]">
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
          className="text-sm font-bold text-[#55688f] transition hover:text-[#102653] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#245ba2]"
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
    accountRoleResult,
    facultiesResult,
    programsResult,
    skillsResult,
    expertiseResult,
    expertiseCategoriesResult,
    interestsResult,
    goalsResult,
    profileResult,
    profileProgramsResult,
    facultyExpertiseResult,
    profileSkillsResult,
    profileInterestsResult,
    profileGoalsResult,
    userResult,
  ] = await Promise.all([
    supabase
      .from("account_roles")
      .select("account_role")
      .eq("user_id", accountState.userId)
      .maybeSingle(),
    supabase
      .from("faculties")
      .select("id,display_name")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("display_name", { ascending: true }),
    supabase
      .from("academic_programs")
      .select("id,faculty_id,display_name,study_level,specialty_code")
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
      .from("expertise")
      .select("id,category_id,name,search_aliases,sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("expertise_categories")
      .select("id,name,sort_order")
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
        "account_role,full_name,faculty_id,academic_program_id,year_of_study,bio,availability",
      )
      .eq("user_id", accountState.userId)
      .maybeSingle(),
    supabase
      .from("profile_academic_programs")
      .select("academic_program_id,is_primary")
      .eq("user_id", accountState.userId),
    supabase
      .from("faculty_expertise")
      .select("expertise_id")
      .eq("user_id", accountState.userId),
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
    accountRoleResult.error,
    facultiesResult.error,
    programsResult.error,
    skillsResult.error,
    expertiseResult.error,
    expertiseCategoriesResult.error,
    interestsResult.error,
    goalsResult.error,
    profileResult.error,
    profileProgramsResult.error,
    facultyExpertiseResult.error,
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
  const selectedAccountRole =
    profile?.account_role ??
    ((accountRoleResult.data?.account_role ?? null) as AccountRole | null);
  const suggestedFullName = profile
    ? null
    : normalizeSignupFullName(userResult.data.user?.user_metadata?.full_name);
  const profileSkills = profileSkillsResult.data ?? [];
  const profileProgramIds = new Set(
    (profileProgramsResult.data ?? [])
      .filter((program) => !program.is_primary)
      .map((program) => program.academic_program_id),
  );
  const facultyExpertiseIds = new Set(
    (facultyExpertiseResult.data ?? []).map(
      (expertise) => expertise.expertise_id,
    ),
  );
  const categoriesById = new Map(
    (expertiseCategoriesResult.data ?? []).map((category) => [
      category.id,
      category.name,
    ]),
  );
  const expertiseOptions = (expertiseResult.data ?? []).map((expertise) => ({
    category: categoriesById.get(expertise.category_id) ?? "Expertise",
    id: expertise.id,
    is_featured: expertise.sort_order <= 160,
    name: expertise.name,
    search_aliases: expertise.search_aliases,
  }));
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
  if (!selectedAccountRole) {
    return <RoleSelection error={firstParam(params.error)} />;
  }

  const progress = {
    hasBasicProfile: Boolean(profile),
    offerSkillCount: offerSkillIds.size,
    lookingForSkillCount: lookingForSkillIds.size,
    interestCount: interestIds.size,
    collaborationGoalCount: collaborationGoalIds.size,
  };
  const firstIncompleteStep =
    selectedAccountRole === "faculty"
      ? !profile
        ? 1
        : facultyExpertiseIds.size < 1
          ? 2
          : null
      : getFirstIncompleteOnboardingStep(progress);
  const requestedStep = parseOnboardingStep(firstParam(params.step));
  const defaultStep = firstIncompleteStep ?? 4;

  if (!requestedStep) {
    redirect(`/account/setup?step=${defaultStep}`);
  }

  if (!canVisitOnboardingStep(requestedStep, firstIncompleteStep)) {
    redirect(`/account/setup?step=${defaultStep}`);
  }

  const error = firstParam(params.error);
  let stepContent: ReactNode;
  let shellTitle: string;
  let shellDescription: string;

  if (selectedAccountRole === "faculty") {
    if (requestedStep === 1) {
      shellTitle = "Academic programs";
      shellDescription =
        "Choose your primary NaUKMA academic program and any additional programs you support.";
      stepContent = (
        <FacultyProgramsForm
          defaultProgramIds={profileProgramIds}
          profile={profile}
          programs={(programsResult.data ?? []) as ProgramOption[]}
          suggestedFullName={suggestedFullName}
        />
      );
    } else if (requestedStep === 2) {
      shellTitle = "Expertise";
      shellDescription =
        "Choose at least one expertise area students can use to find you.";
      stepContent = (
        <SkillStep
          action="/account/setup/faculty-expertise"
          backHref="/account/setup?step=1"
          defaultSkillIds={facultyExpertiseIds}
          emptyLabel="Choose at least one faculty expertise area."
          fieldName="expertiseId"
          searchLabel="Add more expertise"
          searchPlaceholder="Search expertise"
          selectedLabel="Selected expertise"
          skills={expertiseOptions as SkillOption[]}
          suggestedLabel="Suggested expertise"
          title={shellTitle}
        />
      );
    } else if (requestedStep === 3) {
      shellTitle = "Research interests";
      shellDescription =
        "Add optional research interests, or skip this step for now.";
      stepContent = (
        <FacultyResearchStep
          defaultInterestIds={interestIds}
          interests={(interestsResult.data ?? []) as NamedOption[]}
        />
      );
    } else {
      shellTitle = "Preview faculty profile";
      shellDescription =
        "Review the required faculty details before joining the faculty directory.";
      stepContent = (
        <FacultyPreviewStep
          expertiseCount={facultyExpertiseIds.size}
          interestCount={interestIds.size}
          programCount={profileProgramIds.size + (profile ? 1 : 0)}
          profile={profile}
        />
      );
    }
  } else if (requestedStep === 1) {
    shellTitle = "Basic profile";
    shellDescription =
      "Tell collaborators who you are. Your student email is already linked to your account and is not part of this form.";
    stepContent = (
      <OnboardingBasicForm
        faculties={(facultiesResult.data ?? []) as FacultyOption[]}
        programs={(programsResult.data ?? []) as ProgramOption[]}
        profile={profile}
        suggestedFullName={suggestedFullName}
      />
    );
  } else if (requestedStep === 2) {
    shellTitle = "Skills you can offer";
    shellDescription =
      "Choose at least one skill you can bring to another student's project.";
    stepContent = (
      <SkillStep
        action="/account/setup/offer"
        backHref="/account/setup?step=1"
        defaultSkillIds={offerSkillIds}
        fieldName="skillId"
        skills={(skillsResult.data ?? []) as SkillOption[]}
        title={shellTitle}
      />
    );
  } else if (requestedStep === 3) {
    shellTitle = "What are you looking for?";
    shellDescription =
      "Choose skills you would like to find in collaborators, or skip this for now.";
    stepContent = (
      <SkillStep
        action="/account/setup/looking-for"
        backHref="/account/setup?step=2"
        defaultSkillIds={lookingForSkillIds}
        fieldName="skillId"
        isOptional
        skills={(skillsResult.data ?? []) as SkillOption[]}
        title={shellTitle}
      />
    );
  } else {
    shellTitle = "What do you want to build?";
    shellDescription =
      "Choose interests and collaboration goals if you already know what you want to explore, or skip this for now.";
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
    <OnboardingShell
      description={shellDescription}
      error={error}
      step={requestedStep}
      title={shellTitle}
    >
      {stepContent}
    </OnboardingShell>
  );
}
