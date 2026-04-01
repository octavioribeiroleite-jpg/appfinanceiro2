

# Reorganizar Dashboard — Layout por seções claras

## Problema atual
Os atalhos rápidos aparecem todos expandidos (ex: 12 alunos da Cíntia ocupam muito espaço). O usuário quer uma hierarquia clara:
1. Previsão salarial no topo
2. Atalhos rápidos (botões de lançamento rápido)
3. Cards de resumo por categoria (agrupados, colapsáveis) — ex: "Personal Cintia" mostra 1 card com total e qtd, ao clicar abre popup com a lista completa

## Nova ordem do Dashboard

```text
┌─────────────────────────────┐
│ 1. Previsão Salarial        │  ← SalaryForecast (já existe)
├─────────────────────────────┤
│ 2. Atalhos Rápidos          │  ← Botões grid 3 colunas
│    [+ Adicionar atalho]     │
├─────────────────────────────┤
│ 3. Resumo por Categoria     │  ← Cards agrupados:
│    ┌──────┐ ┌──────┐        │     Personal Cintia (12) R$8.610
│    │Eletro│ │RaioX │        │     Clica → popup com lista
│    └──────┘ └──────┘        │
│    ┌────────────────┐       │
│    │Personal Cintia │       │
│    └────────────────┘       │
├─────────────────────────────┤
│ 4. Cards financeiros (7)    │  ← Bruto, Líquido, Dízimo, etc.
│ 5. Investimento             │
│ 6. Ganhos por Fonte         │
│ 7. Resumo Anual + Charts   │
└─────────────────────────────┘
```

## Mudanças

### 1. Dashboard.tsx — Reordenar e criar seção de categorias colapsadas
- Mover `SalaryForecast` para ser o **primeiro** elemento (acima dos atalhos)
- Manter atalhos rápidos logo abaixo
- **Nova seção**: "Resumo por Categoria" — agrupa atalhos por `categoria_id`, mostra 1 card por categoria com:
  - Nome da categoria, cor, quantidade de atalhos, valor total
  - Ao clicar no card, abre um Dialog/Sheet listando todos os atalhos daquela categoria com botão de lançar cada um
- Adicionar estado `categoriaAberta` para controlar qual popup está aberto

### 2. Novo componente `CategoryGroupDialog.tsx`
- Dialog que recebe uma lista de atalhos de uma categoria
- Mostra lista com nome, valor, e botão "Lançar" em cada item
- Ao clicar "Lançar", abre o `QuickValueDialog` existente para confirmar valor

### Arquivos a modificar
1. **`src/pages/Dashboard.tsx`** — Reordenar seções, criar grid de cards por categoria, gerenciar estado do popup
2. **`src/components/dashboard/CategoryGroupDialog.tsx`** — Novo componente para listar atalhos de uma categoria em popup

