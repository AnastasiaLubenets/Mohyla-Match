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
      academic_programs: {
        Row: {
          avatar_variant_key: string;
          created_at: string;
          display_name: string;
          faculty_id: number;
          id: number;
          is_active: boolean;
          slug: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          avatar_variant_key: string;
          created_at?: string;
          display_name: string;
          faculty_id: number;
          id?: number;
          is_active?: boolean;
          slug: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          avatar_variant_key?: string;
          created_at?: string;
          display_name?: string;
          faculty_id?: number;
          id?: number;
          is_active?: boolean;
          slug?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      collaboration_goals: {
        Row: {
          created_at: string;
          id: number;
          is_active: boolean;
          name: string;
          slug: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: number;
          is_active?: boolean;
          name: string;
          slug: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: number;
          is_active?: boolean;
          name?: string;
          slug?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      faculties: {
        Row: {
          avatar_theme_key: string;
          created_at: string;
          display_name: string;
          id: number;
          is_active: boolean;
          slug: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          avatar_theme_key: string;
          created_at?: string;
          display_name: string;
          id?: number;
          is_active?: boolean;
          slug: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          avatar_theme_key?: string;
          created_at?: string;
          display_name?: string;
          id?: number;
          is_active?: boolean;
          slug?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      interests: {
        Row: {
          created_at: string;
          id: number;
          is_active: boolean;
          name: string;
          slug: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: number;
          is_active?: boolean;
          name: string;
          slug: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: number;
          is_active?: boolean;
          name?: string;
          slug?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      product_events: {
        Row: {
          created_at: string;
          event_name: string;
          id: number;
          match_id: string | null;
          metadata: Json;
          subject_user_id: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          event_name: string;
          id?: number;
          match_id?: string | null;
          metadata?: Json;
          subject_user_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          event_name?: string;
          id?: number;
          match_id?: string | null;
          metadata?: Json;
          subject_user_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      profile_collaboration_goals: {
        Row: {
          collaboration_goal_id: number;
          created_at: string;
          user_id: string;
        };
        Insert: {
          collaboration_goal_id: number;
          created_at?: string;
          user_id: string;
        };
        Update: {
          collaboration_goal_id?: number;
          created_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profile_interests: {
        Row: {
          created_at: string;
          interest_id: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          interest_id: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          interest_id?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      profile_skills: {
        Row: {
          created_at: string;
          direction: Database["public"]["Enums"]["skill_direction"];
          skill_id: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          direction: Database["public"]["Enums"]["skill_direction"];
          skill_id: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          direction?: Database["public"]["Enums"]["skill_direction"];
          skill_id?: number;
          user_id?: string;
        };
        Relationships: [];
      };
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
          system_avatar_key?: string;
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
      skills: {
        Row: {
          category: string;
          created_at: string;
          id: number;
          is_active: boolean;
          is_featured: boolean;
          name: string;
          search_aliases: string[];
          slug: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          category: string;
          created_at?: string;
          id?: number;
          is_active?: boolean;
          is_featured?: boolean;
          name: string;
          search_aliases?: string[];
          slug: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          id?: number;
          is_active?: boolean;
          is_featured?: boolean;
          name?: string;
          search_aliases?: string[];
          slug?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      complete_onboarding: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      delete_my_profile: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      get_current_account_state: {
        Args: Record<PropertyKey, never>;
        Returns: "onboarding_incomplete" | "active" | "suspended" | "deleted";
      };
      get_matched_contact_email: {
        Args: {
          target_user_id: string;
        };
        Returns: {
          corporate_email: string;
          full_name: string;
          user_id: string;
        }[];
      };
      update_my_profile: {
        Args: {
          collaboration_goal_ids: number[];
          interest_ids: number[];
          looking_for_skill_ids: number[];
          offer_skill_ids: number[];
          profile_academic_program_id: number;
          profile_availability: string | null;
          profile_bio: string | null;
          profile_faculty_id: number;
          profile_full_name: string;
          profile_year_of_study: number;
        };
        Returns: undefined;
      };
    };
    Enums: {
      interaction_action: "connect" | "save" | "skip";
      match_status: "active" | "blocked" | "closed";
      profile_status: "active" | "suspended" | "deleted";
      report_status: "open" | "reviewing" | "resolved" | "dismissed";
      skill_direction: "offer" | "looking_for";
      user_role: "admin";
    };
    CompositeTypes: Record<string, never>;
  };
};
