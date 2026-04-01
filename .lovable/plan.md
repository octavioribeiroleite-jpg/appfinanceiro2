

# Atalhos Rápidos Configuráveis

Transformar os atalhos rápidos do Dashboard (hoje fixos no código) em atalhos dinâmicos que o usuário gerencia: cria, edita nome, valor padrão, categoria, e ao clicar já cria o lançamento automaticamente.

## 1. Nova tabela `atalhos_rapidos`

Criar via migration:

```sql
CREATE TABLE public.atalhos_rapidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome text NOT NULL,              -- ex: "Eletro Centro"
  categoria_id uuid NOT NULL,
  pessoa_id uuid,
  valor_padrao numeric NOT NULL DEFAULT 0, -- ex: 130
  cor text DEFAULT '#3B82F6',
  icone text DEFAULT 'zap',
  ordem integer DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.atalhos_rapidos ENABLE ROW LEVEL SECURITY;
-- RLS: select/insert/update/delete own
```

## 2. Seed padrão no signup

Atualizar a função `seed_user_data` para inserir atalhos iniciais:
- "Raio X" (categoria Raio X, valor 0)
- "Eletro" (categoria Eletro, valor 130)
- "Personal" (categoria Personal esposa, valor 0)
- "Venda" (categoria Vendas, valor 0)

## 3. Hook `useAtalhosRapidos`

Novo hook em `useFinanceData.ts` para buscar atalhos do usuário.

## 4. Dashboard — atalhos dinâmicos

- Substituir `quickActions` fixo por dados da tabela
- Ao clicar num atalho: cria o lançamento direto (com valor padrão + regras da categoria) e mostra toast de confirmação
- Se valor padrão for 0, redireciona para `/novo` com categoria pré-selecionada (comportamento atual)

## 5. Tela de gerenciamento dos atalhos

Nova aba "Atalhos Rápidos" na página de Configurações:
- Lista dos atalhos com nome, categoria, valor, cor
- Editar nome, valor padrão, categoria, pessoa
- Adicionar novo atalho
- Reordenar / ativar / desativar / excluir
- Escolher cor e ícone

## Resumo do fluxo

1. Usuário abre Configurações > aba "Atalhos"
2. Cria "Eletro Centro" com categoria Eletro, valor R$130
3. No Dashboard, aparece o botão "Eletro Centro"
4. Clica → lançamento criado automaticamente com R$130, descontos aplicados, toast "Lançamento criado!"

