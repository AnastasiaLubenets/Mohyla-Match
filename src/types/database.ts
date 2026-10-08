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
          official_source_url: string | null;
          slug: string;
          sort_order: number;
          specialty_code: string | null;
          study_level: Database["public"]["Enums"]["academic_program_level"];
          updated_at: string;
        };
        Insert: {
          avatar_variant_key: string;
          created_at?: string;
          display_name: string;
          faculty_id: number;
          id?: number;
          is_active?: boolean;
          official_source_url?: string | null;
          slug: string;
          sort_order?: number;
          specialty_code?: string | null;
          study_level?: Database["public"]["Enums"]["academic_program_level"];
          updated_at?: string;
        };
        Update: {
          avatar_variant_key?: string;
          created_at?: string;
          display_name?: string;
          faculty_id?: number;
          id?: number;
          is_active?: boolean;
          official_source_url?: string | null;
          slug?: string;
          sort_order?: number;
          specialty_code?: string | null;
          study_level?: Database["public"]["Enums"]["academic_program_level"];
          updated_at?: string;
        };
        Relationships: [];
      };
      account_roles: {
        Row: {
          account_role: Database["public"]["Enums"]["account_role"];
          created_at: string;
          faculty_verification_status: Database["public"]["Enums"]["faculty_verification_status"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          account_role?: Database["public"]["Enums"]["account_role"];
          created_at?: string;
          faculty_verification_status?: Database["public"]["Enums"]["faculty_verification_status"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          account_role?: Database["public"]["Enums"]["account_role"];
          created_at?: string;
          faculty_verification_status?: Database["public"]["Enums"]["faculty_verification_status"];
          updated_at?: string;
          user_id?: string;
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
      expertise_categories: {
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
      expertise: {
        Row: {
          category_id: number;
          created_at: string;
          id: number;
          is_active: boolean;
          name: string;
          search_aliases: string[];
          slug: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          category_id: number;
          created_at?: string;
          id?: number;
          is_active?: boolean;
          name: string;
          search_aliases?: string[];
          slug: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          category_id?: number;
          created_at?: string;
          id?: number;
          is_active?: boolean;
          name?: string;
          search_aliases?: string[];
          slug?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      academic_program_expertise: {
        Row: {
          academic_program_id: number;
          created_at: string;
          expertise_id: number;
        };
        Insert: {
          academic_program_id: number;
          created_at?: string;
          expertise_id: number;
        };
        Update: {
          academic_program_id?: number;
          created_at?: string;
          expertise_id?: number;
        };
        Relationships: [];
      };
      faculty_expertise: {
        Row: {
          created_at: string;
          expertise_id: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          expertise_id: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          expertise_id?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      faculty_verification_attempts: {
        Row: {
          created_at: string;
          id: number;
          ip_hash: string | null;
          succeeded: boolean;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: number;
          ip_hash?: string | null;
          succeeded?: boolean;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: number;
          ip_hash?: string | null;
          succeeded?: boolean;
          user_id?: string;
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
      blocks: {
        Row: {
          blocked_user_id: string;
          blocker_user_id: string;
          created_at: string;
        };
        Insert: {
          blocked_user_id: string;
          blocker_user_id: string;
          created_at?: string;
        };
        Update: {
          blocked_user_id?: string;
          blocker_user_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      interactions: {
        Row: {
          action: Database["public"]["Enums"]["interaction_action"];
          created_at: string;
          source_user_id: string;
          target_user_id: string;
          updated_at: string;
        };
        Insert: {
          action: Database["public"]["Enums"]["interaction_action"];
          created_at?: string;
          source_user_id: string;
          target_user_id: string;
          updated_at?: string;
        };
        Update: {
          action?: Database["public"]["Enums"]["interaction_action"];
          created_at?: string;
          source_user_id?: string;
          target_user_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      matches: {
        Row: {
          closed_at: string | null;
          created_at: string;
          id: string;
          status: Database["public"]["Enums"]["match_status"];
          user_high: string;
          user_low: string;
        };
        Insert: {
          closed_at?: string | null;
          created_at?: string;
          id?: string;
          status?: Database["public"]["Enums"]["match_status"];
          user_high: string;
          user_low: string;
        };
        Update: {
          closed_at?: string | null;
          created_at?: string;
          id?: string;
          status?: Database["public"]["Enums"]["match_status"];
          user_high?: string;
          user_low?: string;
        };
        Relationships: [];
      };
      matching_config: {
        Row: {
          availability_weight: number;
          collaboration_goals_weight: number;
          common_interests_weight: number;
          created_at: string;
          is_active: boolean;
          my_looking_for_their_offer_weight: number;
          their_looking_for_my_offer_weight: number;
          updated_at: string;
          version: number;
        };
        Insert: {
          availability_weight: number;
          collaboration_goals_weight: number;
          common_interests_weight: number;
          created_at?: string;
          is_active?: boolean;
          my_looking_for_their_offer_weight: number;
          their_looking_for_my_offer_weight: number;
          updated_at?: string;
          version: number;
        };
        Update: {
          availability_weight?: number;
          collaboration_goals_weight?: number;
          common_interests_weight?: number;
          created_at?: string;
          is_active?: boolean;
          my_looking_for_their_offer_weight?: number;
          their_looking_for_my_offer_weight?: number;
          updated_at?: string;
          version?: number;
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
      reports: {
        Row: {
          created_at: string;
          details: string | null;
          id: string;
          reason_code: string;
          reported_user_id: string;
          reporter_user_id: string;
          resolved_at: string | null;
          status: Database["public"]["Enums"]["report_status"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          details?: string | null;
          id?: string;
          reason_code: string;
          reported_user_id: string;
          reporter_user_id: string;
          resolved_at?: string | null;
          status?: Database["public"]["Enums"]["report_status"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          details?: string | null;
          id?: string;
          reason_code?: string;
          reported_user_id?: string;
          reporter_user_id?: string;
          resolved_at?: string | null;
          status?: Database["public"]["Enums"]["report_status"];
          updated_at?: string;
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
      profile_social_links: {
        Row: {
          created_at: string;
          id: string;
          platform: string;
          sort_order: number;
          updated_at: string;
          url: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          platform: string;
          sort_order?: number;
          updated_at?: string;
          url: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          platform?: string;
          sort_order?: number;
          updated_at?: string;
          url?: string;
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
      profile_academic_programs: {
        Row: {
          academic_program_id: number;
          created_at: string;
          is_primary: boolean;
          user_id: string;
        };
        Insert: {
          academic_program_id: number;
          created_at?: string;
          is_primary?: boolean;
          user_id: string;
        };
        Update: {
          academic_program_id?: number;
          created_at?: string;
          is_primary?: boolean;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          account_role: Database["public"]["Enums"]["account_role"];
          academic_program_id: number;
          allow_direct_contact: boolean;
          avatar_mode: Database["public"]["Enums"]["profile_avatar_mode"];
          availability: string | null;
          bio: string | null;
          created_at: string;
          custom_avatar_key: string | null;
          deleted_at: string | null;
          faculty_verification_status: Database["public"]["Enums"]["faculty_verification_status"];
          faculty_id: number;
          full_name: string;
          onboarding_completed_at: string | null;
          profile_status: Database["public"]["Enums"]["profile_status"];
          system_avatar_key: string;
          updated_at: string;
          user_id: string;
          year_of_study: number | null;
        };
        Insert: {
          account_role?: Database["public"]["Enums"]["account_role"];
          academic_program_id: number;
          allow_direct_contact?: boolean;
          avatar_mode?: Database["public"]["Enums"]["profile_avatar_mode"];
          availability?: string | null;
          bio?: string | null;
          created_at?: string;
          custom_avatar_key?: string | null;
          deleted_at?: string | null;
          faculty_verification_status?: Database["public"]["Enums"]["faculty_verification_status"];
          faculty_id: number;
          full_name: string;
          onboarding_completed_at?: string | null;
          profile_status?: Database["public"]["Enums"]["profile_status"];
          system_avatar_key?: string;
          updated_at?: string;
          user_id: string;
          year_of_study?: number | null;
        };
        Update: {
          account_role?: Database["public"]["Enums"]["account_role"];
          academic_program_id?: number;
          allow_direct_contact?: boolean;
          avatar_mode?: Database["public"]["Enums"]["profile_avatar_mode"];
          availability?: string | null;
          bio?: string | null;
          created_at?: string;
          custom_avatar_key?: string | null;
          deleted_at?: string | null;
          faculty_verification_status?: Database["public"]["Enums"]["faculty_verification_status"];
          faculty_id?: number;
          full_name?: string;
          onboarding_completed_at?: string | null;
          profile_status?: Database["public"]["Enums"]["profile_status"];
          system_avatar_key?: string;
          updated_at?: string;
          user_id?: string;
          year_of_study?: number | null;
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
      save_account_role: {
        Args: {
          selected_role: Database["public"]["Enums"]["account_role"];
        };
        Returns: Database["public"]["Enums"]["account_role"];
      };
      block_user: {
        Args: {
          target_user_id: string;
        };
        Returns: boolean;
      };
      get_discovery_candidates: {
        Args: {
          candidate_limit?: number;
        };
        Returns: {
          academic_program_name: string;
          availability: string | null;
          bio: string | null;
          collaboration_goals: Json;
          compatibility_score: number;
          faculty_name: string;
          full_name: string;
          interests: Json;
          looking_for_skills: Json;
          matched_i_offer: Json;
          matched_they_offer: Json;
          score_breakdown: Json;
          shared_collaboration_goals: Json;
          shared_interests: Json;
          offered_skills: Json;
          system_avatar_key: string;
          user_id: string;
          year_of_study: number;
        }[];
      };
      get_all_discovery_profiles: {
        Args: {
          profile_limit?: number;
        };
        Returns: {
          academic_program_name: string;
          availability: string | null;
          bio: string | null;
          collaboration_goals: Json;
          compatibility_score: number;
          faculty_name: string;
          full_name: string;
          interests: Json;
          looking_for_skills: Json;
          matched_i_offer: Json;
          matched_they_offer: Json;
          score_breakdown: Json;
          shared_collaboration_goals: Json;
          shared_interests: Json;
          offered_skills: Json;
          system_avatar_key: string;
          user_id: string;
          year_of_study: number;
        }[];
      };
      get_faculty_discovery_profiles: {
        Args: {
          profile_limit?: number;
        };
        Returns: {
          academic_programs: Json;
          availability: string | null;
          bio: string | null;
          expertise: Json;
          faculty_name: string;
          full_name: string;
          primary_academic_program_name: string;
          research_interests: Json;
          system_avatar_key: string;
          user_id: string;
          verification_status: Database["public"]["Enums"]["faculty_verification_status"];
        }[];
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
      get_profile_contact_email: {
        Args: {
          target_user_id: string;
        };
        Returns: {
          contact_email: string;
          full_name: string;
          user_id: string;
        }[];
      };
      get_my_matches: {
        Args: {
          match_limit?: number;
        };
        Returns: {
          academic_program_name: string;
          availability: string | null;
          bio: string | null;
          can_direct_contact: boolean;
          collaboration_goals: Json;
          faculty_name: string;
          full_name: string;
          interests: Json;
          looking_for_skills: Json;
          match_id: string;
          matched_at: string;
          offered_skills: Json;
          system_avatar_key: string;
          user_id: string;
          year_of_study: number;
        }[];
      };
      get_saved_profiles: {
        Args: {
          saved_limit?: number;
        };
        Returns: {
          academic_program_name: string;
          availability: string | null;
          bio: string | null;
          can_direct_contact: boolean;
          collaboration_goals: Json;
          faculty_name: string;
          full_name: string;
          interests: Json;
          looking_for_skills: Json;
          offered_skills: Json;
          saved_at: string;
          system_avatar_key: string;
          user_id: string;
          year_of_study: number;
        }[];
      };
      get_profile_connection_status: {
        Args: {
          target_user_id: string;
        };
        Returns: {
          blocked_by_me: boolean;
          can_direct_contact: boolean;
          is_matched: boolean;
          match_id: string | null;
          outgoing_action:
            | Database["public"]["Enums"]["interaction_action"]
            | null;
        }[];
      };
      log_email_contact_clicked: {
        Args: {
          target_user_id: string;
        };
        Returns: boolean;
      };
      report_user: {
        Args: {
          details?: string | null;
          reason_code: string;
          target_user_id: string;
        };
        Returns: string;
      };
      set_discovery_action: {
        Args: {
          requested_action: Database["public"]["Enums"]["interaction_action"];
          target_user_id: string;
        };
        Returns: {
          action: Database["public"]["Enums"]["interaction_action"];
          match_id: string | null;
          matched: boolean;
        }[];
      };
      set_saved_profile: {
        Args: {
          should_save: boolean;
          target_user_id: string;
        };
        Returns: {
          action: Database["public"]["Enums"]["interaction_action"] | null;
          match_id: string | null;
          matched: boolean;
          saved: boolean;
        }[];
      };
      update_my_profile: {
        Args: {
          collaboration_goal_ids: number[];
          interest_ids: number[];
          looking_for_skill_ids: number[];
          offer_skill_ids: number[];
          profile_academic_program_id: number;
          profile_allow_direct_contact?: boolean;
          profile_availability: string | null;
          profile_bio: string | null;
          profile_faculty_id: number;
          profile_full_name: string;
          profile_year_of_study: number;
        };
        Returns: undefined;
      };
      update_faculty_profile: {
        Args: {
          additional_academic_program_ids: number[];
          expertise_ids: number[];
          primary_academic_program_id: number;
          profile_allow_direct_contact?: boolean;
          profile_availability: string | null;
          profile_bio: string | null;
          profile_full_name: string;
          research_interest_ids: number[];
        };
        Returns: undefined;
      };
    };
    Enums: {
      account_role: "student" | "faculty";
      academic_program_level: "bachelor" | "master";
      faculty_verification_status: "unverified" | "verified";
      interaction_action: "connect" | "save" | "skip";
      match_status: "active" | "blocked" | "closed";
      profile_avatar_mode: "default" | "program" | "custom";
      profile_status: "active" | "suspended" | "deleted";
      report_status: "open" | "reviewing" | "resolved" | "dismissed";
      skill_direction: "offer" | "looking_for";
      user_role: "admin";
    };
    CompositeTypes: Record<string, never>;
  };
};
