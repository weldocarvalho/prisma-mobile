export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      app_settings: {
        Row: {
          key: string;
          updated_at: string;
          updated_by: string | null;
          value: Json;
        };
        Insert: {
          key: string;
          updated_at?: string;
          updated_by?: string | null;
          value: Json;
        };
        Update: {
          key?: string;
          updated_at?: string;
          updated_by?: string | null;
          value?: Json;
        };
        Relationships: [];
      };
      admin_users: {
        Row: {
          created_at: string;
          paywall_bypass: boolean;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          paywall_bypass?: boolean;
          user_id: string;
        };
        Update: {
          created_at?: string;
          paywall_bypass?: boolean;
          user_id?: string;
        };
        Relationships: [];
      };
      cancellation_tickets: {
        Row: {
          admin_notes: string | null;
          environment: string;
          id: string;
          last_error: string | null;
          payment_method: string | null;
          plan: string;
          reason_code: string;
          reason_details: string | null;
          requested_at: string;
          resolution: string | null;
          resolved_at: string | null;
          resolved_by: string | null;
          source: string;
          status: string;
          subscription_id: string | null;
          subscription_period_end: string | null;
          updated_at: string;
          user_email: string | null;
          user_id: string;
          user_name: string | null;
        };
        Insert: {
          admin_notes?: string | null;
          environment?: string;
          id?: string;
          last_error?: string | null;
          payment_method?: string | null;
          plan: string;
          reason_code: string;
          reason_details?: string | null;
          requested_at?: string;
          resolution?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          source: string;
          status?: string;
          subscription_id?: string | null;
          subscription_period_end?: string | null;
          updated_at?: string;
          user_email?: string | null;
          user_id: string;
          user_name?: string | null;
        };
        Update: {
          admin_notes?: string | null;
          environment?: string;
          id?: string;
          last_error?: string | null;
          payment_method?: string | null;
          plan?: string;
          reason_code?: string;
          reason_details?: string | null;
          requested_at?: string;
          resolution?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          source?: string;
          status?: string;
          subscription_id?: string | null;
          subscription_period_end?: string | null;
          updated_at?: string;
          user_email?: string | null;
          user_id?: string;
          user_name?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "cancellation_tickets_subscription_id_fkey";
            columns: ["subscription_id"];
            isOneToOne: false;
            referencedRelation: "subscriptions";
            referencedColumns: ["id"];
          },
        ];
      };
      check_ins: {
        Row: {
          created_at: string;
          day: string;
          id: string;
          profile_id: string;
          sleep_hours: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          day: string;
          id?: string;
          profile_id: string;
          sleep_hours: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          day?: string;
          id?: string;
          profile_id?: string;
          sleep_hours?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "check_ins_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "nutrition_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      check_outs: {
        Row: {
          created_at: string;
          day: string;
          id: string;
          profile_id: string;
          updated_at: string;
          water_liters: number;
        };
        Insert: {
          created_at?: string;
          day: string;
          id?: string;
          profile_id: string;
          updated_at?: string;
          water_liters: number;
        };
        Update: {
          created_at?: string;
          day?: string;
          id?: string;
          profile_id?: string;
          updated_at?: string;
          water_liters?: number;
        };
        Relationships: [
          {
            foreignKeyName: "check_outs_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "nutrition_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      landing_page_visits: {
        Row: {
          ad_source: string | null;
          browser_locale: string | null;
          created_at: string;
          device_type: string | null;
          event_type: string;
          fbclid: string | null;
          full_url: string | null;
          id: string;
          path: string;
          referrer: string | null;
          screen_height: number | null;
          screen_width: number | null;
          session_id: string | null;
          user_agent: string | null;
          user_id: string | null;
          utm_campaign: string | null;
          utm_content: string | null;
          utm_medium: string | null;
          utm_source: string | null;
          utm_term: string | null;
          visitor_id: string | null;
        };
        Insert: {
          ad_source?: string | null;
          browser_locale?: string | null;
          created_at?: string;
          device_type?: string | null;
          event_type: string;
          fbclid?: string | null;
          full_url?: string | null;
          id?: string;
          path: string;
          referrer?: string | null;
          screen_height?: number | null;
          screen_width?: number | null;
          session_id?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
          utm_campaign?: string | null;
          utm_content?: string | null;
          utm_medium?: string | null;
          utm_source?: string | null;
          utm_term?: string | null;
          visitor_id?: string | null;
        };
        Update: {
          ad_source?: string | null;
          browser_locale?: string | null;
          created_at?: string;
          device_type?: string | null;
          event_type?: string;
          fbclid?: string | null;
          full_url?: string | null;
          id?: string;
          path?: string;
          referrer?: string | null;
          screen_height?: number | null;
          screen_width?: number | null;
          session_id?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
          utm_campaign?: string | null;
          utm_content?: string | null;
          utm_medium?: string | null;
          utm_source?: string | null;
          utm_term?: string | null;
          visitor_id?: string | null;
        };
        Relationships: [];
      };
      meal_logs: {
        Row: {
          ai_confidence: string | null;
          created_at: string;
          day: string;
          description: string | null;
          estimated_calories: number | null;
          estimated_carbs_g: number | null;
          estimated_fat_g: number | null;
          estimated_protein_g: number | null;
          id: string;
          logged_via: string;
          meal_type: string;
          photo_url: string | null;
          profile_id: string;
          updated_at: string;
        };
        Insert: {
          ai_confidence?: string | null;
          created_at?: string;
          day: string;
          description?: string | null;
          estimated_calories?: number | null;
          estimated_carbs_g?: number | null;
          estimated_fat_g?: number | null;
          estimated_protein_g?: number | null;
          id?: string;
          logged_via?: string;
          meal_type: string;
          photo_url?: string | null;
          profile_id: string;
          updated_at?: string;
        };
        Update: {
          ai_confidence?: string | null;
          created_at?: string;
          day?: string;
          description?: string | null;
          estimated_calories?: number | null;
          estimated_carbs_g?: number | null;
          estimated_fat_g?: number | null;
          estimated_protein_g?: number | null;
          id?: string;
          logged_via?: string;
          meal_type?: string;
          photo_url?: string | null;
          profile_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "meal_logs_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "nutrition_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      milestone_events: {
        Row: {
          id: string;
          label: string;
          milestone_id: string;
          profile_id: string;
          seen_at: string;
        };
        Insert: {
          id?: string;
          label: string;
          milestone_id: string;
          profile_id: string;
          seen_at?: string;
        };
        Update: {
          id?: string;
          label?: string;
          milestone_id?: string;
          profile_id?: string;
          seen_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "milestone_events_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "nutrition_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      nutrition_plans: {
        Row: {
          adaptation_tips: Json;
          attempt_number: number | null;
          client_wait_ms: number | null;
          created_at: string;
          daily_meal_structure: Json;
          foods_to_moderate: Json;
          generation_duration_ms: number | null;
          generation_source: string | null;
          generation_started_at: string | null;
          id: string;
          is_confirmed: boolean;
          is_current: boolean;
          model_used: string | null;
          profile_id: string;
          recommended_foods: Json;
          summary: string | null;
          updated_at: string;
          validation_report: Json | null;
          version: number;
          weekly_plan: Json;
        };
        Insert: {
          adaptation_tips?: Json;
          attempt_number?: number | null;
          client_wait_ms?: number | null;
          created_at?: string;
          daily_meal_structure?: Json;
          foods_to_moderate?: Json;
          generation_duration_ms?: number | null;
          generation_source?: string | null;
          generation_started_at?: string | null;
          id?: string;
          is_confirmed?: boolean;
          is_current?: boolean;
          model_used?: string | null;
          profile_id: string;
          recommended_foods?: Json;
          summary?: string | null;
          updated_at?: string;
          validation_report?: Json | null;
          version: number;
          weekly_plan?: Json;
        };
        Update: {
          adaptation_tips?: Json;
          attempt_number?: number | null;
          client_wait_ms?: number | null;
          created_at?: string;
          daily_meal_structure?: Json;
          foods_to_moderate?: Json;
          generation_duration_ms?: number | null;
          generation_source?: string | null;
          generation_started_at?: string | null;
          id?: string;
          is_confirmed?: boolean;
          is_current?: boolean;
          model_used?: string | null;
          profile_id?: string;
          recommended_foods?: Json;
          summary?: string | null;
          updated_at?: string;
          validation_report?: Json | null;
          version?: number;
          weekly_plan?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "nutrition_plans_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "nutrition_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      nutrition_profiles: {
        Row: {
          activity_level: string | null;
          allergies: Json;
          biological_sex: string | null;
          birth_date: string | null;
          budget_level: string | null;
          created_at: string;
          current_weight_kg: number | null;
          daily_calorie_target: number | null;
          daily_carbs_target_g: number | null;
          daily_fat_target_g: number | null;
          daily_protein_target_g: number | null;
          daily_water_target_liters: number | null;
          dietary_style: string | null;
          email_validated_at: string | null;
          experience_level: string | null;
          foods_to_avoid: string[];
          goal: string;
          health_conditions: Json;
          height_cm: number | null;
          id: string;
          last_reengagement_threshold: number | null;
          locale: string;
          name: string | null;
          notify_email_milestone: boolean;
          notify_email_reengagement: boolean;
          notify_email_reminder: boolean;
          notify_email_weekly_digest: boolean;
          notify_push_enabled: boolean;
          notify_push_milestone: boolean;
          notify_push_reengagement: boolean;
          notify_push_reminder: boolean;
          notify_push_weekly_digest: boolean;
          notify_reminder_slot: string;
          onboarded_at: string | null;
          plan_attempt_count: number;
          plan_confirmed_at: string | null;
          pregnancy_or_breastfeeding: boolean;
          referral_code: string;
          referral_reward_granted_at: string | null;
          referred_by_profile_id: string | null;
          refined_at: string | null;
          refinement_answers: Json | null;
          target_weight_kg: number | null;
          time_availability: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          activity_level?: string | null;
          allergies?: Json;
          biological_sex?: string | null;
          birth_date?: string | null;
          budget_level?: string | null;
          created_at?: string;
          current_weight_kg?: number | null;
          daily_calorie_target?: number | null;
          daily_carbs_target_g?: number | null;
          daily_fat_target_g?: number | null;
          daily_protein_target_g?: number | null;
          daily_water_target_liters?: number | null;
          dietary_style?: string | null;
          email_validated_at?: string | null;
          experience_level?: string | null;
          foods_to_avoid?: string[];
          goal: string;
          health_conditions?: Json;
          height_cm?: number | null;
          id?: string;
          last_reengagement_threshold?: number | null;
          locale?: string;
          name?: string | null;
          notify_email_milestone?: boolean;
          notify_email_reengagement?: boolean;
          notify_email_reminder?: boolean;
          notify_email_weekly_digest?: boolean;
          notify_push_enabled?: boolean;
          notify_push_milestone?: boolean;
          notify_push_reengagement?: boolean;
          notify_push_reminder?: boolean;
          notify_push_weekly_digest?: boolean;
          notify_reminder_slot?: string;
          onboarded_at?: string | null;
          plan_attempt_count?: number;
          plan_confirmed_at?: string | null;
          pregnancy_or_breastfeeding?: boolean;
          referral_code?: string;
          referral_reward_granted_at?: string | null;
          referred_by_profile_id?: string | null;
          refined_at?: string | null;
          refinement_answers?: Json | null;
          target_weight_kg?: number | null;
          time_availability?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          activity_level?: string | null;
          allergies?: Json;
          biological_sex?: string | null;
          birth_date?: string | null;
          budget_level?: string | null;
          created_at?: string;
          current_weight_kg?: number | null;
          daily_calorie_target?: number | null;
          daily_carbs_target_g?: number | null;
          daily_fat_target_g?: number | null;
          daily_protein_target_g?: number | null;
          daily_water_target_liters?: number | null;
          dietary_style?: string | null;
          email_validated_at?: string | null;
          experience_level?: string | null;
          foods_to_avoid?: string[];
          goal?: string;
          health_conditions?: Json;
          height_cm?: number | null;
          id?: string;
          last_reengagement_threshold?: number | null;
          locale?: string;
          name?: string | null;
          notify_email_milestone?: boolean;
          notify_email_reengagement?: boolean;
          notify_email_reminder?: boolean;
          notify_email_weekly_digest?: boolean;
          notify_push_enabled?: boolean;
          notify_push_milestone?: boolean;
          notify_push_reengagement?: boolean;
          notify_push_reminder?: boolean;
          notify_push_weekly_digest?: boolean;
          notify_reminder_slot?: string;
          onboarded_at?: string | null;
          plan_attempt_count?: number;
          plan_confirmed_at?: string | null;
          pregnancy_or_breastfeeding?: boolean;
          referral_code?: string;
          referral_reward_granted_at?: string | null;
          referred_by_profile_id?: string | null;
          refined_at?: string | null;
          refinement_answers?: Json | null;
          target_weight_kg?: number | null;
          time_availability?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          access_days: number | null;
          amount_cents: number;
          created_at: string;
          currency: string;
          environment: string;
          id: string;
          paddle_transaction_id: string | null;
          paid_at: string | null;
          payment_method: string | null;
          plan: string | null;
          source: string;
          status: string;
          stripe_checkout_session_id: string | null;
          stripe_payment_intent_id: string | null;
          subscription_id: string | null;
          user_id: string;
        };
        Insert: {
          access_days?: number | null;
          amount_cents: number;
          created_at?: string;
          currency?: string;
          environment?: string;
          id?: string;
          paddle_transaction_id?: string | null;
          paid_at?: string | null;
          payment_method?: string | null;
          plan?: string | null;
          source?: string;
          status: string;
          stripe_checkout_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          subscription_id?: string | null;
          user_id: string;
        };
        Update: {
          access_days?: number | null;
          amount_cents?: number;
          created_at?: string;
          currency?: string;
          environment?: string;
          id?: string;
          paddle_transaction_id?: string | null;
          paid_at?: string | null;
          payment_method?: string | null;
          plan?: string | null;
          source?: string;
          status?: string;
          stripe_checkout_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          subscription_id?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      pending_onboarding: {
        Row: {
          created_at: string;
          plan: string | null;
          quiz_answers: Json | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          plan?: string | null;
          quiz_answers?: Json | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          plan?: string | null;
          quiz_answers?: Json | null;
          user_id?: string;
        };
        Relationships: [];
      };
      plan_adherence_checks: {
        Row: {
          created_at: string;
          day: string;
          id: string;
          period: string;
          profile_id: string;
          step: number;
        };
        Insert: {
          created_at?: string;
          day: string;
          id?: string;
          period: string;
          profile_id: string;
          step: number;
        };
        Update: {
          created_at?: string;
          day?: string;
          id?: string;
          period?: string;
          profile_id?: string;
          step?: number;
        };
        Relationships: [
          {
            foreignKeyName: "plan_adherence_checks_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "nutrition_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      plan_changes: {
        Row: {
          changes: Json;
          created_at: string;
          id: string;
          profile_id: string;
          summary: string | null;
          week_start: string;
        };
        Insert: {
          changes?: Json;
          created_at?: string;
          id?: string;
          profile_id: string;
          summary?: string | null;
          week_start: string;
        };
        Update: {
          changes?: Json;
          created_at?: string;
          id?: string;
          profile_id?: string;
          summary?: string | null;
          week_start?: string;
        };
        Relationships: [
          {
            foreignKeyName: "plan_changes_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "nutrition_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      progress_photos: {
        Row: {
          created_at: string;
          day: string;
          id: string;
          profile_id: string;
        };
        Insert: {
          created_at?: string;
          day: string;
          id?: string;
          profile_id: string;
        };
        Update: {
          created_at?: string;
          day?: string;
          id?: string;
          profile_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "progress_photos_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "nutrition_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      mobile_push_tokens: {
        Row: {
          app_version: string | null;
          created_at: string;
          device_name: string | null;
          id: string;
          platform: string;
          profile_id: string;
          token: string;
          updated_at: string;
        };
        Insert: {
          app_version?: string | null;
          created_at?: string;
          device_name?: string | null;
          id?: string;
          platform: string;
          profile_id: string;
          token: string;
          updated_at?: string;
        };
        Update: {
          app_version?: string | null;
          created_at?: string;
          device_name?: string | null;
          id?: string;
          platform?: string;
          profile_id?: string;
          token?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mobile_push_tokens_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "nutrition_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      push_subscriptions: {
        Row: {
          auth: string;
          created_at: string;
          endpoint: string;
          id: string;
          p256dh: string;
          profile_id: string;
          user_agent: string | null;
        };
        Insert: {
          auth: string;
          created_at?: string;
          endpoint: string;
          id?: string;
          p256dh: string;
          profile_id: string;
          user_agent?: string | null;
        };
        Update: {
          auth?: string;
          created_at?: string;
          endpoint?: string;
          id?: string;
          p256dh?: string;
          profile_id?: string;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "nutrition_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      referral_redemptions: {
        Row: {
          code: string;
          created_at: string;
          days_granted: number;
          environment: string;
          id: string;
          redeemed_email: string;
          redeemed_user_id: string | null;
          referrer_user_id: string | null;
        };
        Insert: {
          code: string;
          created_at?: string;
          days_granted?: number;
          environment?: string;
          id?: string;
          redeemed_email: string;
          redeemed_user_id?: string | null;
          referrer_user_id?: string | null;
        };
        Update: {
          code?: string;
          created_at?: string;
          days_granted?: number;
          environment?: string;
          id?: string;
          redeemed_email?: string;
          redeemed_user_id?: string | null;
          referrer_user_id?: string | null;
        };
        Relationships: [];
      };
      refunds: {
        Row: {
          admin_user_id: string | null;
          amount_cents: number | null;
          created_at: string;
          currency: string | null;
          environment: string;
          id: string;
          paddle_adjustment_id: string | null;
          paddle_subscription_id: string | null;
          paddle_transaction_id: string;
          reason: string;
          status: string;
          stripe_charge_id: string | null;
          stripe_refund_id: string | null;
          subscription_id: string | null;
          user_id: string | null;
        };
        Insert: {
          admin_user_id?: string | null;
          amount_cents?: number | null;
          created_at?: string;
          currency?: string | null;
          environment?: string;
          id?: string;
          paddle_adjustment_id?: string | null;
          paddle_subscription_id?: string | null;
          paddle_transaction_id: string;
          reason: string;
          status: string;
          stripe_charge_id?: string | null;
          stripe_refund_id?: string | null;
          subscription_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          admin_user_id?: string | null;
          amount_cents?: number | null;
          created_at?: string;
          currency?: string | null;
          environment?: string;
          id?: string;
          paddle_adjustment_id?: string | null;
          paddle_subscription_id?: string | null;
          paddle_transaction_id?: string;
          reason?: string;
          status?: string;
          stripe_charge_id?: string | null;
          stripe_refund_id?: string | null;
          subscription_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      signup_attempts: {
        Row: {
          created_at: string;
          email_domain: string | null;
          id: string;
          ip_hash: string;
        };
        Insert: {
          created_at?: string;
          email_domain?: string | null;
          id?: string;
          ip_hash: string;
        };
        Update: {
          created_at?: string;
          email_domain?: string | null;
          id?: string;
          ip_hash?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          bonus_period_end: string | null;
          cancel_at_period_end: boolean;
          canceled_at: string | null;
          created_at: string;
          current_period_end: string | null;
          current_period_start: string | null;
          environment: string;
          grant_reason: string | null;
          granted_by: string | null;
          id: string;
          paddle_customer_id: string | null;
          paddle_subscription_id: string | null;
          payment_method: string;
          plan: string;
          price_id: string | null;
          product_id: string | null;
          source: string;
          status: string;
          stripe_checkout_session_id: string | null;
          stripe_customer_id: string | null;
          store: string | null;
          stripe_subscription_id: string | null;
          trial_ended_email_sent_at: string | null;
          trial_reminder_sent_at: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          bonus_period_end?: string | null;
          cancel_at_period_end?: boolean;
          canceled_at?: string | null;
          created_at?: string;
          current_period_end?: string | null;
          current_period_start?: string | null;
          environment?: string;
          grant_reason?: string | null;
          granted_by?: string | null;
          id?: string;
          paddle_customer_id?: string | null;
          paddle_subscription_id?: string | null;
          payment_method?: string;
          plan: string;
          price_id?: string | null;
          product_id?: string | null;
          source?: string;
          status: string;
          stripe_checkout_session_id?: string | null;
          stripe_customer_id?: string | null;
          store?: string | null;
          stripe_subscription_id?: string | null;
          trial_ended_email_sent_at?: string | null;
          trial_reminder_sent_at?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          bonus_period_end?: string | null;
          cancel_at_period_end?: boolean;
          canceled_at?: string | null;
          created_at?: string;
          current_period_end?: string | null;
          current_period_start?: string | null;
          environment?: string;
          grant_reason?: string | null;
          granted_by?: string | null;
          id?: string;
          paddle_customer_id?: string | null;
          paddle_subscription_id?: string | null;
          payment_method?: string;
          plan?: string;
          price_id?: string | null;
          product_id?: string | null;
          source?: string;
          status?: string;
          stripe_checkout_session_id?: string | null;
          stripe_customer_id?: string | null;
          store?: string | null;
          stripe_subscription_id?: string | null;
          trial_ended_email_sent_at?: string | null;
          trial_reminder_sent_at?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      trial_leads: {
        Row: {
          activated_at: string | null;
          created_at: string;
          email: string;
          id: string;
          plan: string;
          source: string | null;
          status: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          activated_at?: string | null;
          created_at?: string;
          email: string;
          id?: string;
          plan: string;
          source?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          activated_at?: string | null;
          created_at?: string;
          email?: string;
          id?: string;
          plan?: string;
          source?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      weekly_feedback: {
        Row: {
          created_at: string;
          id: string;
          new_challenges: string[];
          profile_id: string;
          satisfaction: number;
          updated_at: string;
          week_start: string;
          what_didnt: string | null;
          what_worked: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          new_challenges?: string[];
          profile_id: string;
          satisfaction: number;
          updated_at?: string;
          week_start: string;
          what_didnt?: string | null;
          what_worked?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          new_challenges?: string[];
          profile_id?: string;
          satisfaction?: number;
          updated_at?: string;
          week_start?: string;
          what_didnt?: string | null;
          what_worked?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "weekly_feedback_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "nutrition_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      weight_logs: {
        Row: {
          created_at: string;
          day: string;
          id: string;
          profile_id: string;
          updated_at: string;
          weight_kg: number;
        };
        Insert: {
          created_at?: string;
          day: string;
          id?: string;
          profile_id: string;
          updated_at?: string;
          weight_kg: number;
        };
        Update: {
          created_at?: string;
          day?: string;
          id?: string;
          profile_id?: string;
          updated_at?: string;
          weight_kg?: number;
        };
        Relationships: [
          {
            foreignKeyName: "weight_logs_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "nutrition_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      register_mobile_push_token: {
        Args: {
          _app_version?: string;
          _device_name?: string;
          _platform: string;
          _profile_id: string;
          _token: string;
        };
        Returns: undefined;
      };
      claim_free_trial: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      admin_get_user_status: {
        Args: { target_email: string };
        Returns: {
          email: string;
          email_confirmed: boolean;
          email_validated_at: string;
          has_identity: boolean;
          subscription_bonus_period_end: string;
          subscription_current_period_end: string;
          subscription_environment: string;
          subscription_id: string;
          subscription_source: string;
          subscription_status: string;
          user_id: string;
        }[];
      };
      owns_profile: { Args: { _profile_id: string }; Returns: boolean };
      has_access: { Args: { _user_id: string; check_env?: string }; Returns: boolean };
      has_active_subscription: {
        Args: { _user_id: string; check_env?: string };
        Returns: boolean;
      };
      check_subscriber_status: { Args: { target_email: string }; Returns: boolean };
      grant_pix_access: {
        Args: {
          _user_id: string;
          _session_id: string;
          _payment_intent_id: string;
          _customer_id: string;
          _plan: string;
          _days: number;
          _amount_cents: number;
          _currency: string;
          _env: string;
        };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
