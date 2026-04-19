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
      calendarios: {
        Row: {
          id: string
          cliente_id: string
          nome: string
          mes: number
          ano: number
          status: 'draft' | 'active' | 'archived'
          token_acesso: string | null
          token_expiracao: string | null
          created_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          cliente_id: string
          nome: string
          mes: number
          ano: number
          status?: 'draft' | 'active' | 'archived'
          token_acesso?: string | null
          token_expiracao?: string | null
          created_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          cliente_id?: string
          nome?: string
          mes?: number
          ano?: number
          status?: 'draft' | 'active' | 'archived'
          token_acesso?: string | null
          token_expiracao?: string | null
          created_at?: string
          deleted_at?: string | null
        }
      }
      clientes: {
        Row: {
          id: string
          nome: string
          created_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          nome: string
          created_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          nome?: string
          created_at?: string
          deleted_at?: string | null
        }
      }
      semanas: {
        Row: {
          id: string
          calendario_id: string
          ordem: number
          nome: string | null
          created_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          calendario_id: string
          ordem: number
          nome?: string | null
          created_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          calendario_id?: string
          ordem?: number
          nome?: string | null
          created_at?: string
          deleted_at?: string | null
        }
      }
      conteudos: {
        Row: {
          id: string
          semana_id: string
          tipo: 'post' | 'story'
          status: 'draft' | 'pending_review' | 'approved' | 'rejected'
          version: number
          data_publicacao: string | null
          dia_semana: number | null
          comentario_cliente: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          semana_id: string
          tipo: 'post' | 'story'
          status?: 'draft' | 'pending_review' | 'approved' | 'rejected'
          version?: number
          data_publicacao?: string | null
          dia_semana?: number | null
          comentario_cliente?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          semana_id?: string
          tipo?: 'post' | 'story'
          status?: 'draft' | 'pending_review' | 'approved' | 'rejected'
          version?: number
          data_publicacao?: string | null
          dia_semana?: number | null
          comentario_cliente?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      posts: {
        Row: {
          id: string
          conteudo_id: string
          formato: 'video' | 'estatico' | 'carrossel'
          legenda: string | null
          drive_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          conteudo_id: string
          formato: 'video' | 'estatico' | 'carrossel'
          legenda?: string | null
          drive_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          conteudo_id?: string
          formato?: 'video' | 'estatico' | 'carrossel'
          legenda?: string | null
          drive_url?: string | null
          created_at?: string
        }
      }
      post_videos: {
        Row: {
          id: string
          post_id: string
          gancho: string
          desenvolvimento: string
          cta: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          gancho: string
          desenvolvimento: string
          cta: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          gancho?: string
          desenvolvimento?: string
          cta?: string
          created_at?: string
        }
      }
      post_estaticos: {
        Row: {
          id: string
          post_id: string
          ideia: string
          imagem_url: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          ideia: string
          imagem_url: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          ideia?: string
          imagem_url?: string
          created_at?: string
        }
      }
      post_carrosseis: {
        Row: {
          id: string
          post_id: string
          ideia: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          ideia: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          ideia?: string
          created_at?: string
        }
      }
      carrossel_imagens: {
        Row: {
          id: string
          carrossel_id: string
          ordem: number
          imagem_url: string
          created_at: string
        }
        Insert: {
          id?: string
          carrossel_id: string
          ordem: number
          imagem_url: string
          created_at?: string
        }
        Update: {
          id?: string
          carrossel_id?: string
          ordem?: number
          imagem_url?: string
          created_at?: string
        }
      }
      stories: {
        Row: {
          id: string
          conteudo_id: string
          texto: string
          created_at: string
        }
        Insert: {
          id?: string
          conteudo_id: string
          texto: string
          created_at?: string
        }
        Update: {
          id?: string
          conteudo_id?: string
          texto?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
