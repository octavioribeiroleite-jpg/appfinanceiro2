

# Melhorar Relatórios — Abas fixas Octávio/Cíntia com progresso recebido/pendente

## O que muda

A página de Relatórios já existe com abas por pessoa, mas tem problemas:
- Só mostra abas de pessoas que já têm lançamentos (se não lançou nada, não aparece)
- Não mostra progresso recebido vs pendente
- Dízimo não tem destaque suficiente

## Nova estrutura

```text
┌─────────────────────────────────┐
│  Relatórios    [Mês ▼] [Ano ▼] │
├─────────────────────────────────┤
│  [Octávio] [Cíntia] [Geral] [Anual] │
├─────────────────────────────────┤
│  ┌─ Progresso do Mês ─────────┐│
│  │ Recebido: R$ 3.200 / 8.610 ││
│  │ ████████░░░░░░  37%        ││
│  │ Falta receber: R$ 5.410    ││
│  └────────────────────────────┘│
│                                 │
│  ┌─ Resumo ───────────────────┐│
│  │ Bruto    Líquido           ││
│  │ Dízimo   Imposto  Gasolina ││
│  └────────────────────────────┘│
│                                 │
│  ┌─ DÍZIMO DO MÊS ───────────┐│
│  │  ⛪ R$ 861,00              ││
│  │  (destaque grande)         ││
│  └────────────────────────────┘│
│                                 │
│  Detalhamento por Categoria    │
│  (tabela existente)            │
│                                 │
│  Lançamentos Detalhados        │
│  (com status recebido/pendente)│
└─────────────────────────────────┘
```

## Mudanças em `src/pages/Relatorios.tsx`

### 1. Abas fixas — sempre mostrar Octávio e Cíntia
- Usar todas as pessoas cadastradas (não filtrar por `pessoaIds`), sempre exibir as abas
- Ordem: Octávio, Cíntia (Esposa), Geral, Anual

### 2. Barra de progresso recebido/pendente no `PessoaReport`
- Calcular total de receitas com `status === 'recebido'` vs `status === 'pendente'`
- Mostrar barra de progresso visual com porcentagem e valores
- "Falta receber: R$ X"

### 3. Card de Dízimo em destaque
- Novo card grande após o resumo, com ícone ⛪ e valor total do dízimo do mês
- Cor vermelha, fonte grande, fácil de ler para saber exatamente quanto devolver à igreja

### 4. Manter tudo que já existe
- Cards resumo (bruto, líquido, dízimo, imposto, gasolina, despesas)
- Gráfico pizza de distribuição
- Tabela por categoria
- Lançamentos detalhados com status

## Arquivo a modificar
- **`src/pages/Relatorios.tsx`** — Único arquivo, refatorar abas e adicionar progresso + destaque dízimo

