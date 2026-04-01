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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      atalhos_rapidos: {
        Row: {
          ativo: boolean
          categoria_id: string
          cor: string | null
          created_at: string
          icone: string | null
          id: string
          nome: string
          ordem: number | null
          pessoa_id: string | null
          user_id: string
          valor_padrao: number
        }
        Insert: {
          ativo?: boolean
          categoria_id: string
          cor?: string | null
          created_at?: string
          icone?: string | null
          id?: string
          nome: string
          ordem?: number | null
          pessoa_id?: string | null
          user_id: string
          valor_padrao?: number
        }
        Update: {
          ativo?: boolean
          categoria_id?: string
          cor?: string | null
          created_at?: string
          icone?: string | null
          id?: string
          nome?: string
          ordem?: number | null
          pessoa_id?: string | null
          user_id?: string
          valor_padrao?: number
        }
        Relationships: [
          {
            foreignKeyName: "atalhos_rapidos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atalhos_rapidos_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias: {
        Row: {
          ativo: boolean
          cor: string | null
          created_at: string
          icone: string | null
          id: string
          nome: string
          tipo: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          cor?: string | null
          created_at?: string
          icone?: string | null
          id?: string
          nome: string
          tipo: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          cor?: string | null
          created_at?: string
          icone?: string | null
          id?: string
          nome?: string
          tipo?: string
          user_id?: string
        }
        Relationships: []
      }
      lancamentos: {
        Row: {
          aplicar_dizimo: boolean
          aplicar_gasolina: boolean
          aplicar_imposto: boolean
          categoria_id: string
          competencia_ano: number
          competencia_mes: number
          created_at: string
          data_prevista: string | null
          data_real: string | null
          descricao: string
          id: string
          modelo_id: string | null
          observacoes: string | null
          percentual_dizimo: number
          percentual_gasolina: number
          percentual_imposto: number
          pessoa_id: string
          status: string
          tipo_lancamento: string
          updated_at: string
          user_id: string
          valor_bruto: number
          valor_dizimo: number
          valor_gasolina: number
          valor_imposto: number
          valor_liquido: number
        }
        Insert: {
          aplicar_dizimo?: boolean
          aplicar_gasolina?: boolean
          aplicar_imposto?: boolean
          categoria_id: string
          competencia_ano: number
          competencia_mes: number
          created_at?: string
          data_prevista?: string | null
          data_real?: string | null
          descricao: string
          id?: string
          modelo_id?: string | null
          observacoes?: string | null
          percentual_dizimo?: number
          percentual_gasolina?: number
          percentual_imposto?: number
          pessoa_id: string
          status: string
          tipo_lancamento: string
          updated_at?: string
          user_id: string
          valor_bruto?: number
          valor_dizimo?: number
          valor_gasolina?: number
          valor_imposto?: number
          valor_liquido?: number
        }
        Update: {
          aplicar_dizimo?: boolean
          aplicar_gasolina?: boolean
          aplicar_imposto?: boolean
          categoria_id?: string
          competencia_ano?: number
          competencia_mes?: number
          created_at?: string
          data_prevista?: string | null
          data_real?: string | null
          descricao?: string
          id?: string
          modelo_id?: string | null
          observacoes?: string | null
          percentual_dizimo?: number
          percentual_gasolina?: number
          percentual_imposto?: number
          pessoa_id?: string
          status?: string
          tipo_lancamento?: string
          updated_at?: string
          user_id?: string
          valor_bruto?: number
          valor_dizimo?: number
          valor_gasolina?: number
          valor_imposto?: number
          valor_liquido?: number
        }
        Relationships: [
          {
            foreignKeyName: "lancamentos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_modelo_id_fkey"
            columns: ["modelo_id"]
            isOneToOne: false
            referencedRelation: "modelos_recorrentes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
        ]
      }
      modelos_recorrentes: {
        Row: {
          ativo: boolean
          categoria_id: string
          created_at: string
          descricao: string
          dia_referencia: number | null
          gerar_automaticamente: boolean
          id: string
          modo_valor: string
          pessoa_id: string
          recorrencia: string
          tipo_lancamento: string
          user_id: string
          valor_padrao: number
        }
        Insert: {
          ativo?: boolean
          categoria_id: string
          created_at?: string
          descricao: string
          dia_referencia?: number | null
          gerar_automaticamente?: boolean
          id?: string
          modo_valor: string
          pessoa_id: string
          recorrencia: string
          tipo_lancamento: string
          user_id: string
          valor_padrao?: number
        }
        Update: {
          ativo?: boolean
          categoria_id?: string
          created_at?: string
          descricao?: string
          dia_referencia?: number | null
          gerar_automaticamente?: boolean
          id?: string
          modo_valor?: string
          pessoa_id?: string
          recorrencia?: string
          tipo_lancamento?: string
          user_id?: string
          valor_padrao?: number
        }
        Relationships: [
          {
            foreignKeyName: "modelos_recorrentes_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modelos_recorrentes_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
        ]
      }
      pessoas: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          tipo: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          tipo: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          tipo?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      regras_categoria: {
        Row: {
          aplicar_dizimo: boolean
          aplicar_gasolina: boolean
          aplicar_imposto: boolean
          ativo: boolean
          categoria_id: string
          created_at: string
          id: string
          percentual_dizimo: number
          percentual_gasolina: number
          percentual_imposto: number
          pessoa_id: string | null
          user_id: string
        }
        Insert: {
          aplicar_dizimo?: boolean
          aplicar_gasolina?: boolean
          aplicar_imposto?: boolean
          ativo?: boolean
          categoria_id: string
          created_at?: string
          id?: string
          percentual_dizimo?: number
          percentual_gasolina?: number
          percentual_imposto?: number
          pessoa_id?: string | null
          user_id: string
        }
        Update: {
          aplicar_dizimo?: boolean
          aplicar_gasolina?: boolean
          aplicar_imposto?: boolean
          ativo?: boolean
          categoria_id?: string
          created_at?: string
          id?: string
          percentual_dizimo?: number
          percentual_gasolina?: number
          percentual_imposto?: number
          pessoa_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "regras_categoria_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regras_categoria_pessoa_id_fkey"
            columns: ["pessoa_id"]
            isOneToOne: false
            referencedRelation: "pessoas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      gerar_recorrencias_mensais: {
        Args: { p_ano: number; p_mes: number; p_user_id: string }
        Returns: undefined
      }
      obter_regra_categoria: {
        Args: { p_categoria_id: string; p_pessoa_id: string; p_user_id: string }
        Returns: {
          aplicar_dizimo: boolean
          aplicar_gasolina: boolean
          aplicar_imposto: boolean
          percentual_dizimo: number
          percentual_gasolina: number
          percentual_imposto: number
        }[]
      }
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
