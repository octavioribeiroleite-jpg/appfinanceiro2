import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function usePessoas() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['pessoas', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pessoas')
        .select('*')
        .eq('ativo', true)
        .order('nome');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCategorias(tipo?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['categorias', user?.id, tipo],
    queryFn: async () => {
      let query = supabase.from('categorias').select('*').eq('ativo', true).order('nome');
      if (tipo) query = query.eq('tipo', tipo);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useRegras() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['regras', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('regras_categoria')
        .select('*, categorias(*), pessoas(*)')
        .eq('ativo', true);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useLancamentos(mes?: number, ano?: number, filters?: {
  pessoa_id?: string;
  categoria_id?: string;
  tipo_lancamento?: string;
  status?: string;
  search?: string;
}) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['lancamentos', user?.id, mes, ano, filters],
    queryFn: async () => {
      let query = supabase
        .from('lancamentos')
        .select('*, categorias(*), pessoas(*)')
        .order('data_prevista', { ascending: false });

      if (mes) query = query.eq('competencia_mes', mes);
      if (ano) query = query.eq('competencia_ano', ano);
      if (filters?.pessoa_id) query = query.eq('pessoa_id', filters.pessoa_id);
      if (filters?.categoria_id) query = query.eq('categoria_id', filters.categoria_id);
      if (filters?.tipo_lancamento) query = query.eq('tipo_lancamento', filters.tipo_lancamento);
      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.search) query = query.ilike('descricao', `%${filters.search}%`);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useLancamentosAno(ano: number) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['lancamentos-ano', user?.id, ano],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lancamentos')
        .select('*, categorias(*), pessoas(*)')
        .eq('competencia_ano', ano)
        .order('competencia_mes');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useModelosRecorrentes() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['modelos', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('modelos_recorrentes')
        .select('*, categorias(*), pessoas(*)')
        .order('descricao');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}
