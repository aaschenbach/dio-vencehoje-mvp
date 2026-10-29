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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          active: boolean
          created_at: string
          id: string
          is_default: boolean
          kind: string
          name: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          is_default?: boolean
          kind: string
          name: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          is_default?: boolean
          kind?: string
          name?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      commercial_notes: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          id: string
          lead_id: string | null
          user_id: string | null
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          id?: string
          lead_id?: string | null
          user_id?: string | null
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          lead_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commercial_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          created_at: string
          email: string | null
          id: string
          kind: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          kind?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          kind?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_entries: {
        Row: {
          amount: number
          category_id: string
          contact_id: string | null
          created_at: string
          description: string
          detached: boolean
          due_date: string
          id: string
          kind: string
          notes: string | null
          original_date: string | null
          rule_id: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          amount: number
          category_id: string
          contact_id?: string | null
          created_at?: string
          description: string
          detached?: boolean
          due_date: string
          id?: string
          kind: string
          notes?: string | null
          original_date?: string | null
          rule_id?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          amount?: number
          category_id?: string
          contact_id?: string | null
          created_at?: string
          description?: string
          detached?: boolean
          due_date?: string
          id?: string
          kind?: string
          notes?: string | null
          original_date?: string | null
          rule_id?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_entries_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_entries_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_entries_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "recurrence_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_entries_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_submissions: {
        Row: {
          comment: string | null
          consent_version: string | null
          created_at: string
          id: string
          ip_hash: string | null
          lead_id: string
          marketing_consent: boolean
          name: string | null
          profile: string | null
          whatsapp: string | null
        }
        Insert: {
          comment?: string | null
          consent_version?: string | null
          created_at?: string
          id?: string
          ip_hash?: string | null
          lead_id: string
          marketing_consent?: boolean
          name?: string | null
          profile?: string | null
          whatsapp?: string | null
        }
        Update: {
          comment?: string | null
          consent_version?: string | null
          created_at?: string
          id?: string
          ip_hash?: string | null
          lead_id?: string
          marketing_consent?: boolean
          name?: string | null
          profile?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_submissions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          anonymized_at: string | null
          comment: string | null
          consent_at: string | null
          consent_version: string | null
          converted_user_id: string | null
          created_at: string
          email: string | null
          email_normalized: string | null
          id: string
          last_submitted_at: string
          marketing_consent: boolean
          name: string | null
          origin: string
          profile: string | null
          status: string
          submission_count: number
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          anonymized_at?: string | null
          comment?: string | null
          consent_at?: string | null
          consent_version?: string | null
          converted_user_id?: string | null
          created_at?: string
          email?: string | null
          email_normalized?: string | null
          id?: string
          last_submitted_at?: string
          marketing_consent?: boolean
          name?: string | null
          origin?: string
          profile?: string | null
          status?: string
          submission_count?: number
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          anonymized_at?: string | null
          comment?: string | null
          consent_at?: string | null
          consent_version?: string | null
          converted_user_id?: string | null
          created_at?: string
          email?: string | null
          email_normalized?: string | null
          id?: string
          last_submitted_at?: string
          marketing_consent?: boolean
          name?: string | null
          origin?: string
          profile?: string | null
          status?: string
          submission_count?: number
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_converted_user_id_fkey"
            columns: ["converted_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          business_name: string | null
          created_at: string
          deletion_requested_at: string | null
          display_name: string | null
          email: string | null
          id: string
          onboarded: boolean
          updated_at: string
          usage_profile: string | null
        }
        Insert: {
          business_name?: string | null
          created_at?: string
          deletion_requested_at?: string | null
          display_name?: string | null
          email?: string | null
          id: string
          onboarded?: boolean
          updated_at?: string
          usage_profile?: string | null
        }
        Update: {
          business_name?: string | null
          created_at?: string
          deletion_requested_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          onboarded?: boolean
          updated_at?: string
          usage_profile?: string | null
        }
        Relationships: []
      }
      recurrence_exceptions: {
        Row: {
          created_at: string
          id: string
          original_date: string
          rule_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          original_date: string
          rule_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          original_date?: string
          rule_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurrence_exceptions_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "recurrence_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurrence_exceptions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      recurrence_rules: {
        Row: {
          amount: number
          anchor_date: string
          category_id: string
          contact_id: string | null
          created_at: string
          description: string
          end_date: string | null
          frequency: string
          generated_until: string | null
          id: string
          kind: string
          notes: string | null
          previous_rule_id: string | null
          start_date: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          amount: number
          anchor_date: string
          category_id: string
          contact_id?: string | null
          created_at?: string
          description: string
          end_date?: string | null
          frequency: string
          generated_until?: string | null
          id?: string
          kind: string
          notes?: string | null
          previous_rule_id?: string | null
          start_date: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          amount?: number
          anchor_date?: string
          category_id?: string
          contact_id?: string | null
          created_at?: string
          description?: string
          end_date?: string | null
          frequency?: string
          generated_until?: string | null
          id?: string
          kind?: string
          notes?: string | null
          previous_rule_id?: string | null
          start_date?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurrence_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurrence_rules_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurrence_rules_previous_rule_id_fkey"
            columns: ["previous_rule_id"]
            isOneToOne: false
            referencedRelation: "recurrence_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurrence_rules_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      settlement_audit: {
        Row: {
          action: string
          actor: string | null
          created_at: string
          entry_id: string
          id: string
          new_amount: number | null
          new_paid_on: string | null
          old_amount: number | null
          old_paid_on: string | null
          settlement_id: string
          workspace_id: string
        }
        Insert: {
          action: string
          actor?: string | null
          created_at?: string
          entry_id: string
          id?: string
          new_amount?: number | null
          new_paid_on?: string | null
          old_amount?: number | null
          old_paid_on?: string | null
          settlement_id: string
          workspace_id: string
        }
        Update: {
          action?: string
          actor?: string | null
          created_at?: string
          entry_id?: string
          id?: string
          new_amount?: number | null
          new_paid_on?: string | null
          old_amount?: number | null
          old_paid_on?: string | null
          settlement_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "settlement_audit_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      settlements: {
        Row: {
          amount: number
          created_at: string
          entry_id: string
          id: string
          notes: string | null
          paid_on: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          entry_id: string
          id?: string
          notes?: string | null
          paid_on: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          entry_id?: string
          id?: string
          notes?: string | null
          paid_on?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "settlements_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries_with_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "financial_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number | null
          created_at: string
          end_date: string | null
          id: string
          notes: string | null
          plan: string
          start_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          plan?: string
          start_date?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          plan?: string
          start_date?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          reminder_days: number
          updated_at: string
          user_id: string
        }
        Insert: {
          reminder_days?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          reminder_days?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workspace_members: {
        Row: {
          created_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      entries_with_status: {
        Row: {
          amount: number | null
          category_id: string | null
          contact_id: string | null
          created_at: string | null
          description: string | null
          detached: boolean | null
          due_date: string | null
          has_settlements: boolean | null
          id: string | null
          kind: string | null
          notes: string | null
          original_date: string | null
          paid_total: number | null
          remaining: number | null
          rule_id: string | null
          status: string | null
          updated_at: string | null
          workspace_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_entries_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_entries_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_entries_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "recurrence_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_entries_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_anonymize_lead: { Args: { _lead_id: string }; Returns: undefined }
      admin_convert_lead: { Args: { _lead_id: string }; Returns: string }
      admin_overview: { Args: never; Returns: Json }
      create_recurring_entry: {
        Args: {
          _amount: number
          _category_id: string
          _contact_id: string
          _description: string
          _end: string
          _frequency: string
          _kind: string
          _notes: string
          _start: string
        }
        Returns: string
      }
      dashboard_totals: { Args: { _from: string; _to: string }; Returns: Json }
      delete_occurrence: { Args: { _entry_id: string }; Returns: undefined }
      delete_series_from: { Args: { _entry_id: string }; Returns: number }
      ensure_occurrences: { Args: { _until?: string }; Returns: number }
      generate_rule_occurrences: {
        Args: { _rule_id: string; _until: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_workspace_member: { Args: { _ws: string }; Returns: boolean }
      my_workspace_id: { Args: never; Returns: string }
      occurrence_date: {
        Args: { _anchor: string; _freq: string; _n: number }
        Returns: string
      }
      sp_today: { Args: never; Returns: string }
      update_series_from: {
        Args: {
          _amount: number
          _category_id: string
          _contact_id: string
          _description: string
          _entry_id: string
          _notes: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
