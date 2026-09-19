export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          academic_program_id: number;
          availability: string | null;
          bio: string | null;
          created_at: string;
          deleted_at: string | null;
          faculty_id: number;
          full_name: string;
          onboarding_completed_at: string | null;
          profile_status: Database["public"]["Enums"]["profile_status"];
          system_avatar_key: string;
          updated_at: string;
          user_id: string;
          year_of_study: number;
        };
        Insert: {
          academic_program_id: number;
          availability?: string | null;
          bio?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          faculty_id: number;
          full_name: string;
          onboarding_completed_at?: string | null;
          profile_status?: Database["public"]["Enums"]["profile_status"];
          system_avatar_key: string;
          updated_at?: string;
          user_id: string;
          year_of_study: number;
        };
        Update: {
          academic_program_id?: number;
          availability?: string | null;
          bio?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          faculty_id?: number;
          full_name?: string;
          onboarding_completed_at?: string | null;
          profile_status?: Database["public"]["Enums"]["profile_status"];
          system_avatar_key?: string;
          updated_at?: string;
          user_id?: string;
          year_of_study?: number;
        };
        Relationships: [];
      };
      signup_email_domains: {
        Row: {
          created_at: string;
          domain: string;
          id: number;
          is_active: boolean;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          domain: string;
          id?: number;
          is_active?: boolean;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          domain?: string;
          id?: number;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      profile_status: "active" | "suspended" | "deleted";
    };
    CompositeTypes: Record<string, never>;
  };
};
