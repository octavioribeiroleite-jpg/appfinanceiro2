

# Melhorar formulário de atalho rápido — categoria visível e agrupada

## Problema atual
O formulário de criar atalho já tem o campo de Categoria, mas o fluxo não fica claro visualmente. O usuário quer: digitar o nome, o valor, e ver claramente **para qual setor/categoria** o dinheiro vai (Raio X, Eletro, Consultoria, etc.), para que o app contabilize corretamente por fonte de renda.

## O que será feito

### 1. Melhorar o formulário de criação de atalho (`Configuracoes.tsx`)
- Reorganizar a ordem dos campos: **Nome → Valor → Categoria** (categoria mais destacada, com cor da categoria visível)
- Mostrar as categorias de receita como **botões coloridos** em vez de um Select dropdown — mais visual e rápido de escolher
- Cada botão mostra a cor da categoria + nome (ex: 🔵 Raio X, 🟣 Eletro, 🟢 Personal, 🟠 Vendas, 🔷 Consultoria)
- Traduzir os ícones para emojis em português (💉 Radial, ❤️ Eletro, 📊 Vendas, 💼 Consultoria, 💰 Dinheiro, 🚗 Gasolina, ⛪ Igreja, ⭐ Outros)

### 2. Agrupar atalhos por categoria na lista
- Na lista de atalhos existentes, agrupar por categoria com título colorido
- Facilita ver quantos atalhos cada setor tem

### 3. Dashboard — agrupar atalhos por categoria
- No Dashboard, agrupar os botões de atalho rápido por categoria com título do setor
- Botão "+ Novo" em cada grupo para adicionar atalho direto naquela categoria

## Arquivos a modificar
1. **`src/pages/Configuracoes.tsx`** — Reorganizar formulário, botões de categoria coloridos, emojis nos ícones, lista agrupada
2. **`src/pages/Dashboard.tsx`** — Agrupar atalhos por `categoria_id` com títulos de setor

