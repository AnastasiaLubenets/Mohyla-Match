const publicSupabaseUrl = "NEXT_PUBLIC_SUPABASE_URL";
const publicSupabasePublishableKey = "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY";

export type SupabasePublicConfig = {
  url: string;
  publishableKey: string;
};

function readRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
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
