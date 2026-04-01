-- Fix search_path on all functions
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.calcular_valores_lancamento()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.tipo_lancamento = 'receita' then
    new.valor_dizimo :=
      case when new.aplicar_dizimo
        then round((new.valor_bruto * new.percentual_dizimo / 100)::numeric, 2)
        else 0 end;
    new.valor_imposto :=
      case when new.aplicar_imposto
        then round((new.valor_bruto * new.percentual_imposto / 100)::numeric, 2)
        else 0 end;
    new.valor_gasolina :=
      case when new.aplicar_gasolina
        then round((new.valor_bruto * new.percentual_gasolina / 100)::numeric, 2)
        else 0 end;
    new.valor_liquido :=
      round((
        new.valor_bruto
        - coalesce(new.valor_dizimo, 0)
        - coalesce(new.valor_imposto, 0)
        - coalesce(new.valor_gasolina, 0)
      )::numeric, 2);
  else
    new.valor_dizimo := 0;
    new.valor_imposto := 0;
    new.valor_gasolina := 0;
    new.valor_liquido := new.valor_bruto;
    new.percentual_dizimo := 0;
    new.percentual_imposto := 0;
    new.percentual_gasolina := 0;
    new.aplicar_dizimo := false;
    new.aplicar_imposto := false;
    new.aplicar_gasolina := false;
  end if;
  return new;
end;
$$;

create or replace function public.obter_regra_categoria(
  p_user_id uuid,
  p_categoria_id uuid,
  p_pessoa_id uuid
)
returns table (
  percentual_dizimo numeric,
  percentual_imposto numeric,
  percentual_gasolina numeric,
  aplicar_dizimo boolean,
  aplicar_imposto boolean,
  aplicar_gasolina boolean
)
language sql
set search_path = public
as $$
  select
    rc.percentual_dizimo,
    rc.percentual_imposto,
    rc.percentual_gasolina,
    rc.aplicar_dizimo,
    rc.aplicar_imposto,
    rc.aplicar_gasolina
  from public.regras_categoria rc
  where rc.user_id = p_user_id
    and rc.categoria_id = p_categoria_id
    and rc.ativo = true
    and (rc.pessoa_id = p_pessoa_id or rc.pessoa_id is null)
  order by case when rc.pessoa_id = p_pessoa_id then 0 else 1 end
  limit 1;
$$;

create or replace function public.gerar_recorrencias_mensais(
  p_user_id uuid,
  p_mes integer,
  p_ano integer
)
returns void
language plpgsql
set search_path = public
as $$
declare
  r record;
  v_existente uuid;
  v_regra record;
  v_data date;
begin
  for r in
    select *
    from public.modelos_recorrentes mr
    where mr.user_id = p_user_id
      and mr.ativo = true
      and mr.gerar_automaticamente = true
      and mr.recorrencia = 'mensal'
  loop
    select l.id into v_existente
    from public.lancamentos l
    where l.user_id = p_user_id
      and l.modelo_id = r.id
      and l.competencia_mes = p_mes
      and l.competencia_ano = p_ano
    limit 1;

    if v_existente is null then
      v_data := make_date(p_ano, p_mes, greatest(1, least(coalesce(r.dia_referencia, 1), 28)));

      select * into v_regra
      from public.obter_regra_categoria(p_user_id, r.categoria_id, r.pessoa_id);

      insert into public.lancamentos (
        user_id, pessoa_id, categoria_id, modelo_id,
        descricao, tipo_lancamento, valor_bruto,
        percentual_dizimo, percentual_imposto, percentual_gasolina,
        aplicar_dizimo, aplicar_imposto, aplicar_gasolina,
        data_prevista, competencia_mes, competencia_ano, status
      ) values (
        p_user_id, r.pessoa_id, r.categoria_id, r.id,
        r.descricao, r.tipo_lancamento, r.valor_padrao,
        coalesce(v_regra.percentual_dizimo, 0),
        coalesce(v_regra.percentual_imposto, 0),
        coalesce(v_regra.percentual_gasolina, 0),
        coalesce(v_regra.aplicar_dizimo, false),
        coalesce(v_regra.aplicar_imposto, false),
        coalesce(v_regra.aplicar_gasolina, false),
        v_data, p_mes, p_ano, 'pendente'
      );
    end if;
  end loop;
end;
$$;