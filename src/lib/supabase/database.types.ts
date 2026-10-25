// Written by hand to match supabase/migrations, in the same format as the
// Supabase CLI output. Once the project is linked, regenerate it with:
//   pnpm db:types
// and the file will be replaced by the real generated version.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: { id: string; is_active: boolean; name: string; slug: string; sort_order: number }
        Insert: { id?: string; is_active?: boolean; name: string; slug: string; sort_order?: number }
        Update: { id?: string; is_active?: boolean; name?: string; slug?: string; sort_order?: number }
        Relationships: []
      }
      delivery_zones: {
        Row: { fee_cents: number; id: string; is_active: boolean; neighborhood: string; sort_order: number }
        Insert: { fee_cents: number; id?: string; is_active?: boolean; neighborhood: string; sort_order?: number }
        Update: { fee_cents?: number; id?: string; is_active?: boolean; neighborhood?: string; sort_order?: number }
        Relationships: []
      }
      opening_hours: {
        Row: { closes_at: string; id: string; opens_at: string; weekday: number }
        Insert: { closes_at: string; id?: string; opens_at: string; weekday: number }
        Update: { closes_at?: string; id?: string; opens_at?: string; weekday?: number }
        Relationships: []
      }
      option_groups: {
        Row: { id: string; internal_name: string | null; max_select: number; min_select: number; name: string }
        Insert: { id?: string; internal_name?: string | null; max_select?: number; min_select?: number; name: string }
        Update: { id?: string; internal_name?: string | null; max_select?: number; min_select?: number; name?: string }
        Relationships: []
      }
      options: {
        Row: {
          id: string
          is_active: boolean
          max_quantity: number
          name: string
          option_group_id: string
          price_cents: number
          sort_order: number
        }
        Insert: {
          id?: string
          is_active?: boolean
          max_quantity?: number
          name: string
          option_group_id: string
          price_cents?: number
          sort_order?: number
        }
        Update: {
          id?: string
          is_active?: boolean
          max_quantity?: number
          name?: string
          option_group_id?: string
          price_cents?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "options_option_group_id_fkey"
            columns: ["option_group_id"]
            isOneToOne: false
            referencedRelation: "option_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      order_item_options: {
        Row: {
          group_name: string
          id: string
          option_id: string | null
          option_name: string
          order_item_id: string
          quantity: number
          unit_price_cents: number
        }
        Insert: {
          group_name: string
          id?: string
          option_id?: string | null
          option_name: string
          order_item_id: string
          quantity?: number
          unit_price_cents: number
        }
        Update: {
          group_name?: string
          id?: string
          option_id?: string | null
          option_name?: string
          order_item_id?: string
          quantity?: number
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_item_options_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_item_options_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          line_total_cents: number
          notes: string | null
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          unit_price_cents: number
        }
        Insert: {
          id?: string
          line_total_cents: number
          notes?: string | null
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          unit_price_cents: number
        }
        Update: {
          id?: string
          line_total_cents?: number
          notes?: string | null
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address_cep: string | null
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_reference: string | null
          address_street: string | null
          change_for_cents: number | null
          created_at: string
          customer_name: string
          customer_phone: string
          delivery_fee_cents: number
          delivery_zone_id: string | null
          fulfillment: Database["public"]["Enums"]["fulfillment_type"]
          id: string
          notes: string | null
          number: number
          payment_method: Database["public"]["Enums"]["payment_method"]
          status: Database["public"]["Enums"]["order_status"]
          subtotal_cents: number
          total_cents: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address_cep?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_reference?: string | null
          address_street?: string | null
          change_for_cents?: number | null
          created_at?: string
          customer_name: string
          customer_phone: string
          delivery_fee_cents?: number
          delivery_zone_id?: string | null
          fulfillment: Database["public"]["Enums"]["fulfillment_type"]
          id?: string
          notes?: string | null
          number?: never
          payment_method: Database["public"]["Enums"]["payment_method"]
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_cents: number
          total_cents: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address_cep?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_reference?: string | null
          address_street?: string | null
          change_for_cents?: number | null
          created_at?: string
          customer_name?: string
          customer_phone?: string
          delivery_fee_cents?: number
          delivery_zone_id?: string | null
          fulfillment?: Database["public"]["Enums"]["fulfillment_type"]
          id?: string
          notes?: string | null
          number?: never
          payment_method?: Database["public"]["Enums"]["payment_method"]
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_cents?: number
          total_cents?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_delivery_zone_id_fkey"
            columns: ["delivery_zone_id"]
            isOneToOne: false
            referencedRelation: "delivery_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      product_option_groups: {
        Row: { option_group_id: string; product_id: string; sort_order: number }
        Insert: { option_group_id: string; product_id: string; sort_order?: number }
        Update: { option_group_id?: string; product_id?: string; sort_order?: number }
        Relationships: [
          {
            foreignKeyName: "product_option_groups_option_group_id_fkey"
            columns: ["option_group_id"]
            isOneToOne: false
            referencedRelation: "option_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_option_groups_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          id: string
          image_path: string | null
          is_active: boolean
          is_featured: boolean
          name: string
          price_cents: number
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          id?: string
          image_path?: string | null
          is_active?: boolean
          is_featured?: boolean
          name: string
          price_cents: number
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_path?: string | null
          is_active?: boolean
          is_featured?: boolean
          name?: string
          price_cents?: number
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
        Row: {
          accepts_pickup: boolean
          address: string
          id: boolean
          instagram_url: string | null
          is_temporarily_closed: boolean
          min_order_cents: number
          name: string
          pix_key: string | null
          tagline: string | null
          timezone: string
          updated_at: string
          whatsapp_number: string
        }
        Insert: {
          accepts_pickup?: boolean
          address: string
          id?: boolean
          instagram_url?: string | null
          is_temporarily_closed?: boolean
          min_order_cents?: number
          name: string
          pix_key?: string | null
          tagline?: string | null
          timezone?: string
          updated_at?: string
          whatsapp_number: string
        }
        Update: {
          accepts_pickup?: boolean
          address?: string
          id?: boolean
          instagram_url?: string | null
          is_temporarily_closed?: boolean
          min_order_cents?: number
          name?: string
          pix_key?: string | null
          tagline?: string | null
          timezone?: string
          updated_at?: string
          whatsapp_number?: string
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      create_order: {
        Args: { p_items: Json; p_order: Json }
        Returns: { id: string; number: number }[]
      }
    }
    Enums: {
      fulfillment_type: "delivery" | "pickup"
      order_status:
        | "received"
        | "preparing"
        | "out_for_delivery"
        | "ready_for_pickup"
        | "completed"
        | "cancelled"
      payment_method: "pix" | "credit_card" | "debit_card" | "cash"
    }
    CompositeTypes: { [_ in never]: never }
  }
}
