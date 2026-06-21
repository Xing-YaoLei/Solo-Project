export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      orders: {
        Row: {
          id: string
          order_no: string
          route_id: string | null
          route_name: string
          amount: number
          subsidy_amount: number
          item_description: string | null
          has_item_damage: boolean
          item_damage_level: string | null
          status: string
          created_at: string
          accepted_at: string | null
          picked_at: string | null
          delivered_at: string | null
          dispatch_duration: number | null
          rider_id: string
          rider_name: string
          customer_id: string
          customer_name: string
          payment_id: string | null
          appeal_id: string | null
        }
        Insert: {
          id?: string
          order_no: string
          route_id?: string | null
          route_name: string
          amount: number
          subsidy_amount: number
          item_description?: string | null
          has_item_damage?: boolean
          item_damage_level?: string | null
          status: string
          created_at?: string
          accepted_at?: string | null
          picked_at?: string | null
          delivered_at?: string | null
          dispatch_duration?: number | null
          rider_id: string
          rider_name: string
          customer_id: string
          customer_name: string
          payment_id?: string | null
          appeal_id?: string | null
        }
        Update: {
          id?: string
          order_no?: string
          route_id?: string | null
          route_name?: string
          amount?: number
          subsidy_amount?: number
          item_description?: string | null
          has_item_damage?: boolean
          item_damage_level?: string | null
          status?: string
          created_at?: string
          accepted_at?: string | null
          picked_at?: string | null
          delivered_at?: string | null
          dispatch_duration?: number | null
          rider_id?: string
          rider_name?: string
          customer_id?: string
          customer_name?: string
          payment_id?: string | null
          appeal_id?: string | null
        }
      }
      payments: {
        Row: {
          id: string
          order_id: string
          transaction_no: string
          amount: number
          subsidy_amount: number
          settlement_amount: number
          payment_method: string
          status: string
          paid_at: string | null
          settlement_date: string | null
          abnormal_deduction: number | null
          deduction_reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          transaction_no: string
          amount: number
          subsidy_amount: number
          settlement_amount: number
          payment_method: string
          status: string
          paid_at?: string | null
          settlement_date?: string | null
          abnormal_deduction?: number | null
          deduction_reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          transaction_no?: string
          amount?: number
          subsidy_amount?: number
          settlement_amount?: number
          payment_method?: string
          status?: string
          paid_at?: string | null
          settlement_date?: string | null
          abnormal_deduction?: number | null
          deduction_reason?: string | null
          created_at?: string
        }
      }
      customer_service_records: {
        Row: {
          id: string
          order_id: string
          ticket_no: string
          type: string
          content: string
          chat_history: Json | null
          operator_id: string
          operator_name: string
          status: string
          created_at: string
          closed_at: string | null
        }
        Insert: {
          id?: string
          order_id: string
          ticket_no: string
          type: string
          content: string
          chat_history?: Json | null
          operator_id: string
          operator_name: string
          status: string
          created_at?: string
          closed_at?: string | null
        }
        Update: {
          id?: string
          order_id?: string
          ticket_no?: string
          type?: string
          content?: string
          chat_history?: Json | null
          operator_id?: string
          operator_name?: string
          status?: string
          created_at?: string
          closed_at?: string | null
        }
      }
      appeals: {
        Row: {
          id: string
          order_id: string
          type: string
          reason: string
          evidence_urls: string[] | null
          status: string
          reviewer_id: string | null
          review_comment: string | null
          reviewed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          type: string
          reason: string
          evidence_urls?: string[] | null
          status: string
          reviewer_id?: string | null
          review_comment?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          type?: string
          reason?: string
          evidence_urls?: string[] | null
          status?: string
          reviewer_id?: string | null
          review_comment?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          order_id: string
          type: string
          priority: string
          status: string
          title: string
          description: string | null
          dispatch_duration: number | null
          damage_level: string | null
          assignee_id: string | null
          assignee_name: string | null
          resolution: string | null
          resolved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          type: string
          priority: string
          status: string
          title: string
          description?: string | null
          dispatch_duration?: number | null
          damage_level?: string | null
          assignee_id?: string | null
          assignee_name?: string | null
          resolution?: string | null
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          type?: string
          priority?: string
          status?: string
          title?: string
          description?: string | null
          dispatch_duration?: number | null
          damage_level?: string | null
          assignee_id?: string | null
          assignee_name?: string | null
          resolution?: string | null
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      conclusions: {
        Row: {
          id: string
          order_id: string
          chart_point_id: string
          chart_type: string
          content: string
          author_id: string
          author_name: string
          attachments: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          chart_point_id: string
          chart_type: string
          content: string
          author_id: string
          author_name: string
          attachments?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          chart_point_id?: string
          chart_type?: string
          content?: string
          author_id?: string
          author_name?: string
          attachments?: string[] | null
          created_at?: string
        }
      }
      subsidy_rules: {
        Row: {
          id: string
          route_id: string
          route_name: string
          base_subsidy: number
          distance_multiplier: number
          time_multiplier: number
          peak_hour_bonus: number
          min_subsidy: number
          max_subsidy: number
          effective_from: string
          effective_to: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          route_id: string
          route_name: string
          base_subsidy: number
          distance_multiplier: number
          time_multiplier: number
          peak_hour_bonus: number
          min_subsidy: number
          max_subsidy: number
          effective_from: string
          effective_to?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          route_id?: string
          route_name?: string
          base_subsidy?: number
          distance_multiplier?: number
          time_multiplier?: number
          peak_hour_bonus?: number
          min_subsidy?: number
          max_subsidy?: number
          effective_from?: string
          effective_to?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      system_configs: {
        Row: {
          id: string
          dispatch_duration_threshold: number
          auto_create_task_on_timeout: boolean
          auto_create_task_on_damage: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          dispatch_duration_threshold?: number
          auto_create_task_on_timeout?: boolean
          auto_create_task_on_damage?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          dispatch_duration_threshold?: number
          auto_create_task_on_timeout?: boolean
          auto_create_task_on_damage?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
