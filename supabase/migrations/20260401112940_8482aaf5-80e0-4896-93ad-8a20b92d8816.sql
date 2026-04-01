
-- 1. Create atalhos_rapidos table
CREATE TABLE public.atalhos_rapidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome text NOT NULL,
  categoria_id uuid NOT NULL REFERENCES public.categorias(id),
  pessoa_id uuid REFERENCES public.pessoas(id),
  valor_padrao numeric NOT NULL DEFAULT 0,
  cor text DEFAULT '#3B82F6',
  icone text DEFAULT 'zap',
  ordem integer DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.atalhos_rapidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "atalhos_select_own" ON public.atalhos_rapidos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "atalhos_insert_own" ON public.atalhos_rapidos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "atalhos_update_own" ON public.atalhos_rapidos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "atalhos_delete_own" ON public.atalhos_rapidos FOR DELETE USING (auth.uid() = user_id);

-- 2. Update seed_user_data to include default shortcuts
CREATE OR REPLACE FUNCTION public.seed_user_data()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_uid uuid := new.id;
  v_octavio_id uuid;
  v_esposa_id uuid;
  v_familia_id uuid;
  v_cat_raiox uuid;
  v_cat_eletro uuid;
  v_cat_personal uuid;
  v_cat_vendas uuid;
begin
  insert into public.pessoas (user_id, nome, tipo) values (v_uid, 'Octávio', 'octavio') returning id into v_octavio_id;
  insert into public.pessoas (user_id, nome, tipo) values (v_uid, 'Esposa', 'esposa') returning id into v_esposa_id;
  insert into public.pessoas (user_id, nome, tipo) values (v_uid, 'Família', 'familia') returning id into v_familia_id;

  insert into public.categorias (user_id, nome, tipo, cor, icone) values (v_uid, 'Raio X', 'receita', '#2563eb', 'activity') returning id into v_cat_raiox;
  insert into public.categorias (user_id, nome, tipo, cor, icone) values (v_uid, 'Eletro', 'receita', '#7c3aed', 'heart') returning id into v_cat_eletro;
  insert into public.categorias (user_id, nome, tipo, cor, icone) values (v_uid, 'Personal esposa', 'receita', '#16a34a', 'dumbbell') returning id into v_cat_personal;
  insert into public.categorias (user_id, nome, tipo, cor, icone) values (v_uid, 'Vendas', 'receita', '#ea580c', 'shopping-bag') returning id into v_cat_vendas;

  insert into public.categorias (user_id, nome, tipo, cor, icone) values (v_uid, 'Dízimo', 'despesa', '#dc2626', 'church');
  insert into public.categorias (user_id, nome, tipo, cor, icone) values (v_uid, 'Imposto', 'despesa', '#b91c1c', 'receipt');
  insert into public.categorias (user_id, nome, tipo, cor, icone) values (v_uid, 'Gasolina', 'despesa', '#f59e0b', 'fuel');
  insert into public.categorias (user_id, nome, tipo, cor, icone) values (v_uid, 'Casa', 'despesa', '#475569', 'home');
  insert into public.categorias (user_id, nome, tipo, cor, icone) values (v_uid, 'Alimentação', 'despesa', '#059669', 'utensils');
  insert into public.categorias (user_id, nome, tipo, cor, icone) values (v_uid, 'Cartão', 'despesa', '#0f172a', 'credit-card');
  insert into public.categorias (user_id, nome, tipo, cor, icone) values (v_uid, 'Combustível', 'despesa', '#ca8a04', 'car');
  insert into public.categorias (user_id, nome, tipo, cor, icone) values (v_uid, 'Água', 'despesa', '#0284c7', 'droplets');
  insert into public.categorias (user_id, nome, tipo, cor, icone) values (v_uid, 'Energia', 'despesa', '#facc15', 'zap');
  insert into public.categorias (user_id, nome, tipo, cor, icone) values (v_uid, 'Internet', 'despesa', '#8b5cf6', 'wifi');
  insert into public.categorias (user_id, nome, tipo, cor, icone) values (v_uid, 'Outros', 'despesa', '#6b7280', 'more-horizontal');

  insert into public.regras_categoria (user_id, categoria_id, percentual_dizimo, percentual_imposto, percentual_gasolina, aplicar_dizimo, aplicar_imposto, aplicar_gasolina)
  values (v_uid, v_cat_raiox, 10, 7, 5, true, true, true);
  insert into public.regras_categoria (user_id, categoria_id, percentual_dizimo, percentual_imposto, percentual_gasolina, aplicar_dizimo, aplicar_imposto, aplicar_gasolina)
  values (v_uid, v_cat_eletro, 10, 7, 5, true, true, true);
  insert into public.regras_categoria (user_id, categoria_id, percentual_dizimo, percentual_imposto, percentual_gasolina, aplicar_dizimo, aplicar_imposto, aplicar_gasolina)
  values (v_uid, v_cat_personal, 10, 0, 0, true, false, false);
  insert into public.regras_categoria (user_id, categoria_id, percentual_dizimo, percentual_imposto, percentual_gasolina, aplicar_dizimo, aplicar_imposto, aplicar_gasolina)
  values (v_uid, v_cat_vendas, 0, 0, 0, false, false, false);

  -- Atalhos rápidos padrão
  insert into public.atalhos_rapidos (user_id, nome, categoria_id, pessoa_id, valor_padrao, cor, icone, ordem)
  values (v_uid, 'Raio X', v_cat_raiox, v_octavio_id, 0, '#2563eb', 'activity', 1);
  insert into public.atalhos_rapidos (user_id, nome, categoria_id, pessoa_id, valor_padrao, cor, icone, ordem)
  values (v_uid, 'Eletro', v_cat_eletro, v_octavio_id, 130, '#7c3aed', 'heart', 2);
  insert into public.atalhos_rapidos (user_id, nome, categoria_id, pessoa_id, valor_padrao, cor, icone, ordem)
  values (v_uid, 'Personal', v_cat_personal, v_esposa_id, 0, '#16a34a', 'dumbbell', 3);
  insert into public.atalhos_rapidos (user_id, nome, categoria_id, pessoa_id, valor_padrao, cor, icone, ordem)
  values (v_uid, 'Venda', v_cat_vendas, v_octavio_id, 0, '#ea580c', 'shopping-bag', 4);

  return new;
end;
$function$;
