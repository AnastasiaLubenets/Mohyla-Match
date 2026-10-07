const publicSupabaseUrl = "NEXT_PUBLIC_SUPABASE_URL";
const publicSupabasePublishableKey = "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY";
const supabaseServiceRoleKey = "SUPABASE_SERVICE_ROLE_KEY";
const serviceRoleKey = "SERVICE_ROLE_KEY";
const legacySupabaseSecretKey = "SUPABASE_SECRET_KEY";

export type SupabasePublicConfig = {
  url: string;
  publishableKey: string;
};

export type SupabaseAdminConfig = {
  url: string;
  serviceRoleKey: string;
};

function readRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function readRequiredAdminKey(): string {
  const value =
    process.env[supabaseServiceRoleKey]?.trim() ||
    process.env[serviceRoleKey]?.trim() ||
    process.env[legacySupabaseSecretKey]?.trim();

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${supabaseServiceRoleKey}`,
    );
  }

  return value;
}

export function hasSupabasePublicConfig(): boolean {
  return Boolean(
    process.env[publicSupabaseUrl]?.trim() &&
      process.env[publicSupabasePublishableKey]?.trim(),
  );
}

export function getSupabasePublicConfig(): SupabasePublicConfig {
  return {
    url: readRequiredEnv(publicSupabaseUrl),
    publishableKey: readRequiredEnv(publicSupabasePublishableKey),
  };
}

export function getSupabaseAdminConfig(): SupabaseAdminConfig {
  return {
    url: readRequiredEnv(publicSupabaseUrl),
    serviceRoleKey: readRequiredAdminKey(),
  };
}
