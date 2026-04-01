

# Caixinhas por Categoria nos Relatórios

## Mudança
Apenas no arquivo `src/pages/Relatorios.tsx`, dentro do componente `PessoaReport`:

**Substituir** a tabela "Detalhamento por Categoria" (linhas 138-184) e a tabela "Lançamentos Detalhados" (linhas 186-219) por **cards individuais colapsáveis** para cada categoria.

## Novo layout (após Dízimo do Mês)

```text
── Fontes de Renda ──────────────────

┌─ Raio X Dinheiro ──────────────────┐
│ ● cor   Bruto: R$ 2.400           │
│ Dízimo: R$ 240 · Imposto: R$ 168  │
│ Gasolina: R$ 240                   │
│ Líquido: R$ 1.752                  │
│ 10 lançamentos · 6 recebidos      │
│ ▼ (clica para expandir)           │
│  ┌─ Fulano 1 - R$ 240 ✅ ─────┐  │
│  ├─ Fulano 2 - R$ 240 ⏳ ─────┤  │
│  └─ ...                        ┘  │
└────────────────────────────────────┘

┌─ Eletro ───────────────────────────┐
│ (mesma estrutura)                  │
└────────────────────────────────────┘
```

## Implementacao

No `PessoaReport`, alterar o agrupamento `porCategoria` para incluir tambem:
- `total` (count de lancamentos)
- `recebidos` (count com status recebido)
- `lancamentos[]` (array dos lancamentos daquela categoria)

Substituir as duas secoes (tabela categoria + tabela lancamentos) por um `map` sobre as categorias, renderizando cada uma como um `Card` com `Collapsible`:
- Header do card: nome com bolinha de cor, bruto e liquido em destaque
- Corpo visivel: dizimo, imposto, gasolina em texto secundario + contagem
- Conteudo colapsavel: lista dos lancamentos individuais com descricao, valor e badge de status

Importar `Collapsible, CollapsibleTrigger, CollapsibleContent` de `@/components/ui/collapsible` e `ChevronDown` de lucide-react.

## Arquivo unico a modificar
- `src/pages/Relatorios.tsx`

