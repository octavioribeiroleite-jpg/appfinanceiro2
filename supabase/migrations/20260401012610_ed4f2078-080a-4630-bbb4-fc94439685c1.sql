-- EXTENSIONS
create extension if not exists pgcrypto;

-- PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- PESSOAS
create table if not exists public.pessoas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  tipo text not null check (tipo in ('octavio', 'esposa', 'familia', 'outro')),
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_pessoas_user_id on public.pessoas(user_id);
alter table public.pessoas enable row level security;

create policy "pessoas_select_own" on public.pessoas for select using (auth.uid() = user_id);
create policy "pessoas_insert_own" on public.pessoas for insert with check (auth.uid() = user_id);
create policy "pessoas_update_own" on public.pessoas for update using (auth.uid() = user_id);
create policy "pessoas_delete_own" on public.pessoas for delete using (auth.uid() = user_id);

-- CATEGORIAS
create table if not exists public.categorias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  tipo text not null check (tipo in ('receita', 'despesa')),
  cor text,
  icone text,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_categorias_user_id on public.categorias(user_id);
create index if not exists idx_categorias_tipo on public.categorias(tipo);
alter table public.categorias enable row level security;

create policy "categorias_select_own" on public.categorias for select using (auth.uid() = user_id);
create policy "categorias_insert_own" on public.categorias for insert with check (auth.uid() = user_id);
create policy "categorias_update_own" on public.categorias for update using (auth.uid() = user_id);
create policy "categorias_delete_own" on public.categorias for delete using (auth.uid() = user_id);

-- REGRAS POR CATEGORIA
create table if not exists public.regras_categoria (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  categoria_id uuid not null references public.categorias(id) on delete cascade,
  pessoa_id uuid references public.pessoas(id) on delete set null,
  percentual_dizimo numeric(10,2) not null default 0,
  percentual_imposto numeric(10,2) not null default 0,
  percentual_gasolina numeric(10,2) not null default 0,
  aplicar_dizimo boolean not null default false,
  aplicar_imposto boolean not null default false,
  aplicar_gasolina boolean not null default false,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_regras_categoria_user_id on public.regras_categoria(user_id);
create index if not exists idx_regras_categoria_categoria_id on public.regras_categoria(categoria_id);
create index if not exists idx_regras_categoria_pessoa_id on public.regras_categoria(pessoa_id);
alter table public.regras_categoria enable row level security;

create policy "regras_categoria_select_own" on public.regras_categoria for select using (auth.uid() = user_id);
create policy "regras_categoria_insert_own" on public.regras_categoria for insert with check (auth.uid() = user_id);
create policy "regras_categoria_update_own" on public.regras_categoria for update using (auth.uid() = user_id);
create policy "regras_categoria_delete_own" on public.regras_categoria for delete using (auth.uid() = user_id);

-- MODELOS RECORRENTES
create table if not exists public.modelos_recorrentes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pessoa_id uuid not null references public.pessoas(id) on delete cascade,
  categoria_id uuid not null references public.categorias(id) on delete cascade,
  descricao text not null,
  tipo_lancamento text not null check (tipo_lancamento in ('receita', 'despesa')),
  modo_valor text not null check (modo_valor in ('fixo', 'editavel', 'incremental')),
  valor_padrao numeric(12,2) not null default 0,
  recorrencia text not null check (recorrencia in ('mensal', 'semanal', 'diario', 'manual')),
  dia_referencia integer,
  gerar_automaticamente boolean not null default true,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_modelos_recorrentes_user_id on public.modelos_recorrentes(user_id);
create index if not exists idx_modelos_recorrentes_categoria_id on public.modelos_recorrentes(categoria_id);
create index if not exists idx_modelos_recorrentes_pessoa_id on public.modelos_recorrentes(pessoa_id);
alter table public.modelos_recorrentes enable row level security;

create policy "modelos_recorrentes_select_own" on public.modelos_recorrentes for select using (auth.uid() = user_id);
create policy "modelos_recorrentes_insert_own" on public.modelos_recorrentes for insert with check (auth.uid() = user_id);
create policy "modelos_recorrentes_update_own" on public.modelos_recorrentes for update using (auth.uid() = user_id);
create policy "modelos_recorrentes_delete_own" on public.modelos_recorrentes for delete using (auth.uid() = user_id);

-- LANCAMENTOS
create table if not exists public.lancamentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pessoa_id uuid not null references public.pessoas(id) on delete cascade,
  categoria_id uuid not null references public.categorias(id) on delete cascade,
  modelo_id uuid references public.modelos_recorrentes(id) on delete set null,
  descricao text not null,
  tipo_lancamento text not null check (tipo_lancamento in ('receita', 'despesa')),
  valor_bruto numeric(12,2) not null default 0,
  percentual_dizimo numeric(10,2) not null default 0,
  percentual_imposto numeric(10,2) not null default 0,
  percentual_gasolina numeric(10,2) not null default 0,
  valor_dizimo numeric(12,2) not null default 0,
  valor_imposto numeric(12,2) not null default 0,
  valor_gasolina numeric(12,2) not null default 0,
  valor_liquido numeric(12,2) not null default 0,
  aplicar_dizimo boolean not null default false,
  aplicar_imposto boolean not null default false,
  aplicar_gasolina boolean not null default false,
  data_prevista date,
  data_real date,
  competencia_mes integer not null check (competencia_mes between 1 and 12),
  competencia_ano integer not null check (competencia_ano between 2000 and 2100),
  status text not null check (status in ('pendente', 'recebido', 'pago', 'atrasado')),
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_lancamentos_user_id on public.lancamentos(user_id);
create index if not exists idx_lancamentos_categoria_id on public.lancamentos(categoria_id);
create index if not exists idx_lancamentos_pessoa_id on public.lancamentos(pessoa_id);
create index if not exists idx_lancamentos_competencia on public.lancamentos(competencia_ano, competencia_mes);
create index if not exists idx_lancamentos_tipo on public.lancamentos(tipo_lancamento);
create index if not exists idx_lancamentos_status on public.lancamentos(status);
alter table public.lancamentos enable row level security;

create policy "lancamentos_select_own" on public.lancamentos for select using (auth.uid() = user_id);
create policy "lancamentos_insert_own" on public.lancamentos for insert with check (auth.uid() = user_id);
create policy "lancamentos_update_own" on public.lancamentos for update using (auth.uid() = user_id);
create policy "lancamentos_delete_own" on public.lancamentos for delete using (auth.uid() = user_id);

-- UPDATED_AT TRIGGER
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_set_updated_at_lancamentos
before update on public.lancamentos
for each row
execute function public.set_updated_at();

-- CÁLCULO AUTOMÁTICO DE VALORES
create or replace function public.calcular_valores_lancamento()
returns trigger
language plpgsql
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

create trigger trg_calcular_valores_lancamento
before insert or update on public.lancamentos
for each row
execute function public.calcular_valores_lancamento();

-- OBTER REGRA DA CATEGORIA
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

-- GERAR RECORRÊNCIAS MENSAIS
create or replace function public.gerar_recorrencias_mensais(
  p_user_id uuid,
  p_mes integer,
  p_ano integer
)
returns void
language plpgsql
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

-- SEED FUNCTION: auto-seed pessoas + categorias + regras on first login
create or replace function public.seed_user_data()
returns trigger
language plpgsql
security definer set search_path = public
as $$
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

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_seed on auth.users;
create trigger on_auth_user_created_seed
  after insert on auth.users
  for each row execute function public.seed_user_data();