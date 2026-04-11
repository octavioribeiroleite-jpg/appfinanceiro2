

# Corrigir "Resumo por Categoria" para mostrar lançamentos reais

## Problema
A seção "Resumo por Categoria" no Dashboard soma `valor_padrao` dos **atalhos rápidos**, não dos **lançamentos reais** do mês. Por isso mostra R$ 820 para Raio X quando na verdade foram recebidos R$ 4.270.

## Solução
Alterar o "Resumo por Categoria" para agrupar os **lançamentos do mês** por categoria, mostrando valores reais (bruto e líquido), quantidade de lançamentos, e status de recebimento.

### Alterações em `src/pages/Dashboard.tsx`
1. Substituir o `atalhosAgrupados` (que agrupa atalhos) por um `lancamentosAgrupados` que agrupa os lançamentos reais do mês por `categoria_id`
2. Cada card mostrará: nome da categoria, cor, valor bruto total, quantidade de lançamentos
3. Ao clicar no card, abrir um dialog mostrando os lançamentos individuais daquela categoria (reutilizar ou adaptar o CategoryGroupDialog)
4. Remover a lógica duplicada com o "Ganhos por Fonte" (CategoryBreakdown) — ambos mostram a mesma coisa, então unificar em uma única seção

### Resultado esperado
- Raio X - Dinheiro: **R$ 4.270,00** (7 lançamentos)
- Vendas: **R$ 628,20** (2 lançamentos)  
- Eletro: **R$ 120,00** (1 lançamento)

