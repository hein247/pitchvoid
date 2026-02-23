export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_feedback: {
        Row: {
          created_at: string
          generated_output: Json | null
          id: string
          issues: string[] | null
          project_id: string
          rating: string
          user_id: string
        }
        Insert: {
          created_at?: string
          generated_output?: Json | null
          id?: string
          issues?: string[] | null
          project_id: string
          rating: string
          user_id: string
        }
        Update: {
          created_at?: string
          generated_output?: Json | null
          id?: string
          issues?: string[] | null
          project_id?: string
          rating?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_feedback_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      output_versions: {
        Row: {
          created_at: string | null
          format: string
          id: string
          output_json: Json
          project_id: string
          trigger: string
          user_id: string
          version_number: number
        }
        Insert: {
          created_at?: string | null
          format: string
          id?: string
          output_json: Json
          project_id: string
          trigger: string
          user_id: string
          version_number: number
        }
        Update: {
          created_at?: string | null
          format?: string
          id?: string
          output_json?: Json
          project_id?: string
          trigger?: string
          user_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "output_versions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "output_versions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          credits: number | null
          current_period_end: string | null
          full_name: string | null
          has_onboarded: boolean
          id: string
          last_pitch_at: string | null
          pitch_count: number | null
          plan: string | null
          plan_interval: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          team_id: string | null
          team_role: string | null
          updated_at: string | null
          writing_preferences: Json | null
        }
        Insert: {
          credits?: number | null
          current_period_end?: string | null
          full_name?: string | null
          has_onboarded?: boolean
          id: string
          last_pitch_at?: string | null
          pitch_count?: number | null
          plan?: string | null
          plan_interval?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          team_id?: string | null
          team_role?: string | null
          updated_at?: string | null
          writing_preferences?: Json | null
        }
        Update: {
          credits?: number | null
          current_period_end?: string | null
          full_name?: string | null
          has_onboarded?: boolean
          id?: string
          last_pitch_at?: string | null
          pitch_count?: number | null
          plan?: string | null
          plan_interval?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          team_id?: string | null
          team_role?: string | null
          updated_at?: string | null
          writing_preferences?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_info_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      project_versions: {
        Row: {
          created_at: string
          generation_context: Json | null
          id: string
          output_data: Json
          output_format: string
          project_id: string
          version_number: number
        }
        Insert: {
          created_at?: string
          generation_context?: Json | null
          id?: string
          output_data: Json
          output_format: string
          project_id: string
          version_number?: number
        }
        Update: {
          created_at?: string
          generation_context?: Json | null
          id?: string
          output_data?: Json
          output_format?: string
          project_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_versions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string | null
          draft_state: Json | null
          id: string
          is_published: boolean | null
          output_data: Json | null
          output_format: string | null
          public_id: string | null
          scenario_description: string | null
          status: string
          target_audience: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          draft_state?: Json | null
          id?: string
          is_published?: boolean | null
          output_data?: Json | null
          output_format?: string | null
          public_id?: string | null
          scenario_description?: string | null
          status?: string
          target_audience?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          draft_state?: Json | null
          id?: string
          is_published?: boolean | null
          output_data?: Json | null
          output_format?: string | null
          public_id?: string | null
          scenario_description?: string | null
          status?: string
          target_audience?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          count: number
          created_at: string
          key: string
          reset_time: string
        }
        Insert: {
          count?: number
          created_at?: string
          key: string
          reset_time: string
        }
        Update: {
          count?: number
          created_at?: string
          key?: string
          reset_time?: string
        }
        Relationships: []
      }
      slides: {
        Row: {
          animation_settings: Json | null
          component_type: string | null
          content: Json | null
          created_at: string | null
          id: string
          image_url: string | null
          layout_type: string | null
          order_index: number | null
          project_id: string
          visual_style: string | null
        }
        Insert: {
          animation_settings?: Json | null
          component_type?: string | null
          content?: Json | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          layout_type?: string | null
          order_index?: number | null
          project_id: string
          visual_style?: string | null
        }
        Update: {
          animation_settings?: Json | null
          component_type?: string | null
          content?: Json | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          layout_type?: string | null
          order_index?: number | null
          project_id?: string
          visual_style?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "slides_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          id: string
          name: string
          owner_id: string
          seat_count: number | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          name: string
          owner_id: string
          seat_count?: number | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          name?: string
          owner_id?: string
          seat_count?: number | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      team_info_safe: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          id: string | null
          name: string | null
          owner_id: string | null
          seat_count: number | null
          subscription_status: string | null
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          id?: string | null
          name?: string | null
          owner_id?: string | null
          seat_count?: number | null
          subscription_status?: string | null
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          id?: string | null
          name?: string | null
          owner_id?: string | null
          seat_count?: number | null
          subscription_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      cleanup_expired_rate_limits: { Args: never; Returns: number }
      is_team_owner: { Args: { team_uuid: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
