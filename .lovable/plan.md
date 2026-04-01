

# Dashboard Redesenhado — Previsão, Atalhos por Categoria e Investimento

## Resumo

Reorganizar o Dashboard com: barra de previsão salarial no topo, atalhos rápidos renomeados por fonte de renda, breakdown inteligente por categoria, acompanhamento mensal/anual e cálculo de investimento (10% do líquido).

## 1. Barra de Previsão Salarial (topo do Dashboard)

Card destacado no topo mostrando:
- **Previsão do mês**: soma dos `valor_padrao` de todos os modelos recorrentes ativos do tipo receita para o mês atual
- **Já recebido**: soma dos lançamentos de receita do mês com status `recebido`
- Barra de progresso visual (recebido / previsão)
- Formato: `R$ 3.200 de R$ 8.500 recebidos`

Dados: usar `useLancamentos` (já existe) + `useModelosRecorrentes` (já existe) para calcular.

## 2. Atalhos Rápidos Renomeados

Atualizar os atalhos padrão no seed para os nomes solicitados:
- **Radial Dinheiro** (categoria Raio X, valor editável ao clicar)
- **Radial Mensal** (categoria Raio X, valor fixo mensal)
- **Eletrocardiograma** (categoria Eletro)
- **Vendas** (categoria Vendas)
- **Consultoria** (nova categoria de receita a criar)

Todos clicáveis para lançamento rápido (já funciona). Se valor = 0, abre form; se > 0, lança direto.

**Edição rápida de valor**: ao clicar num atalho sem valor padrão (como "Radial Dinheiro"), abrir um mini-dialog/popover inline para digitar o valor e confirmar — sem ir para outra página.

## 3. Breakdown Inteligente por Categoria

Nova seção "Ganhos por Fonte" abaixo dos atalhos:
- Agrupa receitas do mês por categoria
- Mostra para cada: nome da categoria, total bruto, total líquido, quantidade de lançamentos
- Cards coloridos com a cor da categoria
- Dados já disponíveis em `lancamentosMes`

## 4. Acompanhamento Mensal e Controle Anual

Melhorar a seção existente de gráficos:
- **Evolução Mensal**: manter o BarChart existente mas adicionar linha de meta/previsão
- **Controle Anual**: card com totais do ano (bruto, líquido, dízimo, imposto, gasolina) — já existe, manter

## 5. Card de Investimento

Novo card destacado:
- Cálculo: **10% do valor líquido do mês** (após dízimo, imposto, gasolina)
- Mostra: `Investir: R$ X` (10% do líquido)
- Fórmula: `resumoMes.liquido * 0.10`
- Cor verde para destacar

## Alterações Técnicas

### Arquivos a modificar:
1. **`src/pages/Dashboard.tsx`** — Reorganizar layout:
   - Topo: Card de previsão salarial com Progress bar
   - Atalhos rápidos com mini-dialog para editar valor ao clicar
   - Seção "Ganhos por Fonte" (breakdown por categoria)
   - Card de Investimento (10% do líquido)
   - Charts existentes (mantidos)
   - Resumo anual (mantido)

2. **`src/hooks/useFinanceData.ts`** — Adicionar hook `usePrevisaoMensal` que busca modelos recorrentes ativos para calcular previsão

### Banco de dados:
- **Migration**: Adicionar categoria "Consultoria" no seed (ou o usuário cria em Configurações)
- Não precisa de novas tabelas — tudo usa dados já existentes

### Novos componentes:
- `Dialog` para edição rápida de valor do atalho (usar o Dialog do shadcn já disponível)

