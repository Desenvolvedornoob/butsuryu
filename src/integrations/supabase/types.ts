export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      early_departures: {
        Row: {
          approved_by: string | null
          created_at: string | null
          date: string
          id: string
          reason: string
          rejected_by: string | null
          reviewed_at: string | null
          status: Database["public"]["Enums"]["request_status"]
          substitute_id: string | null
          time: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          approved_by?: string | null
          created_at?: string | null
          date: string
          id?: string
          reason: string
          rejected_by?: string | null
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          substitute_id?: string | null
          time: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          approved_by?: string | null
          created_at?: string | null
          date?: string
          id?: string
          reason?: string
          rejected_by?: string | null
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          substitute_id?: string | null
          time?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      employee_factories: {
        Row: {
          id: string
          employee_id: string
          factory_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          employee_id: string
          factory_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          employee_id?: string
          factory_id?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_factories_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_factories_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          }
        ]
      }
      factories: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      group_shifts: {
        Row: {
          break_duration: string | null
          break_time: string | null
          created_at: string | null
          end_time: string | null
          group_id: string
          id: string
          shift_name: string
          start_time: string | null
        }
        Insert: {
          break_duration?: string | null
          break_time?: string | null
          created_at?: string | null
          end_time?: string | null
          group_id: string
          id?: string
          shift_name: string
          start_time?: string | null
        }
        Update: {
          break_duration?: string | null
          break_time?: string | null
          created_at?: string | null
          end_time?: string | null
          group_id?: string
          id?: string
          shift_name?: string
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_shifts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string | null
          id: string
          name: string
          primary_leader: string
          responsible: string
          secondary_leader: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          primary_leader: string
          responsible: string
          secondary_leader?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          primary_leader?: string
          responsible?: string
          secondary_leader?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      holidays: {
        Row: {
          blocks_time_off: boolean | null
          created_at: string
          date: string
          factory_id: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          blocks_time_off?: boolean | null
          created_at?: string
          date: string
          factory_id?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          blocks_time_off?: boolean | null
          created_at?: string
          date?: string
          factory_id?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "holidays_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
        ]
      }
      lateness: {
        Row: {
          approved_by: string | null
          arrival_time: string
          created_at: string | null
          date: string
          id: string
          reason: string
          rejected_by: string | null
          reviewed_at: string | null
          status: Database["public"]["Enums"]["request_status"]
          substitute_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          approved_by?: string | null
          arrival_time: string
          created_at?: string | null
          date: string
          id?: string
          reason: string
          rejected_by?: string | null
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          substitute_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          approved_by?: string | null
          arrival_time?: string
          created_at?: string | null
          date?: string
          id?: string
          reason?: string
          rejected_by?: string | null
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          substitute_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      leave_requests: {
        Row: {
          approved_by: string | null
          created_at: string
          end_date: string
          id: string
          reason: string | null
          start_date: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          end_date: string
          id?: string
          reason?: string | null
          start_date: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          end_date?: string
          id?: string
          reason?: string | null
          start_date?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          city: string | null
          created_at: string
          department: string | null
          dismissal_reason: string | null
          factory_id: string | null
          first_name: string | null
          id: string
          phone: string | null
          prestadora: string | null
          responsible: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          department?: string | null
          dismissal_reason?: string | null
          factory_id?: string | null
          first_name?: string | null
          id: string
          phone?: string | null
          prestadora?: string | null
          responsible?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          department?: string | null
          dismissal_reason?: string | null
          factory_id?: string | null
          first_name?: string | null
          id?: string
          phone?: string | null
          prestadora?: string | null
          responsible?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
        ]
      }
      requests: {
        Row: {
          approved_by: string | null
          arrival_time: string | null
          created_at: string | null
          end_date: string | null
          id: string
          reason: string
          rejected_by: string | null
          reviewed_at: string | null
          start_date: string
          status: Database["public"]["Enums"]["request_status"]
          substitute_id: string | null
          time: string | null
          type: Database["public"]["Enums"]["request_type"]
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          approved_by?: string | null
          arrival_time?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          reason: string
          rejected_by?: string | null
          reviewed_at?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["request_status"]
          substitute_id?: string | null
          time?: string | null
          type: Database["public"]["Enums"]["request_type"]
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          approved_by?: string | null
          arrival_time?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          reason?: string
          rejected_by?: string | null
          reviewed_at?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["request_status"]
          substitute_id?: string | null
          time?: string | null
          type?: Database["public"]["Enums"]["request_type"]
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "requests_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      shifts: {
        Row: {
          created_at: string
          end_time: string
          factory_id: string | null
          id: string
          name: string
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_time: string
          factory_id?: string | null
          id?: string
          name: string
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_time?: string
          factory_id?: string | null
          id?: string
          name?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shifts_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
        ]
      }
      time_off: {
        Row: {
          approved_by: string | null
          created_at: string | null
          end_date: string | null
          id: string
          reason: string
          reject_reason: string | null
          rejected_by: string | null
          reviewed_at: string | null
          start_date: string
          status: Database["public"]["Enums"]["request_status"]
          substitute_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          approved_by?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          reason: string
          reject_reason?: string | null
          rejected_by?: string | null
          reviewed_at?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["request_status"]
          substitute_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          approved_by?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          reason?: string
          reject_reason?: string | null
          rejected_by?: string | null
          reviewed_at?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["request_status"]
          substitute_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_off_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_profiles_table: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      request_status: "pending" | "approved" | "rejected"
      request_type: "time-off" | "early-departure" | "lateness"
      user_role: "funcionario" | "superuser" | "admin"
      user_status: "active" | "inactive" | "desligamento"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
