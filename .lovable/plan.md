

# Controle Financeiro Familiar

App web responsivo e mobile-first para controle financeiro de um casal, com receitas, despesas, descontos automáticos (dízimo, imposto, gasolina), relatórios e projeções.

## Fase 1 — Backend (Lovable Cloud / Supabase)

### Autenticação
- Login e cadastro com email/senha via Supabase Auth
- Trigger para criar profile automaticamente no signup

### Banco de Dados
Criar todas as tabelas com RLS por `user_id`:
- **profiles** — dados do usuário autenticado
- **pessoas** — Octávio, Esposa, Família (+ tipo "outro")
- **categorias** — receitas (Raio X, Eletro, Personal esposa, Vendas) e despesas (Dízimo, Imposto, Gasolina, Casa, Alimentação, Cartão, Combustível, Água, Energia, Internet, Outros)
- **regras_categoria** — percentuais de dízimo/imposto/gasolina por categoria (opcionalmente por pessoa)
- **modelos_recorrentes** — templates recorrentes (fixo, editável, incremental)
- **lancamentos** — lançamentos com valor bruto, descontos calculados e valor líquido

### Triggers e Funções
- Trigger `calcular_valores_lancamento` — calcula automaticamente dízimo, imposto, gasolina e líquido antes de insert/update
- Trigger `set_updated_at` — atualiza timestamp
- Função `obter_regra_categoria` — busca regra ativa (prioriza regra por pessoa, fallback global)
- Função `gerar_recorrencias_mensais` — gera lançamentos a partir de modelos recorrentes

### Seed Inicial
- Criar pessoas (Octávio, Esposa, Família) e categorias padrão automaticamente no primeiro login do usuário
- Criar regras padrão: Raio X e Eletro (dízimo 10%, imposto 7%), Personal esposa (dízimo 10%)

## Fase 2 — Telas e Funcionalidades

### 1. Login/Cadastro
- Tela simples, limpa, mobile-first
- Email + senha

### 2. Dashboard (tela principal)
- **Cards do mês**: bruto, líquido, dízimo, imposto, gasolina, despesas, saldo final
- **Resumo anual**: bruto, líquido, imposto, dízimo, gasolina
- **Gráficos**: evolução mensal, distribuição por categoria, bruto × líquido
- **Atalhos rápidos**: "+ Novo Raio X", "+ Novo Eletro" (valor padrão R$130), "+ Novo Personal", "+ Nova Venda"
- Filtros por mês/ano

### 3. Lançamentos
- Lista com filtros (mês, ano, pessoa, categoria, status, tipo)
- Busca textual
- Ações: marcar recebido/pago, editar, excluir, duplicar
- Botão novo lançamento

### 4. Novo/Editar Lançamento
- Campos: pessoa, categoria, descrição, tipo, valor bruto
- Blocos de desconto (dízimo, imposto, gasolina) com toggle + percentual editável + valor calculado em tempo real
- Valor líquido em destaque
- Data prevista, data real, status, observações
- Ao selecionar categoria de receita → preenche percentuais da regra automaticamente

### 5. Recorrências
- Listar modelos recorrentes
- CRUD de modelos (fixo/editável/incremental)
- Ativar/desativar
- Botão para gerar recorrências do mês

### 6. Regras Automáticas
- Lista de categorias de receita com percentuais configuráveis
- Opção por pessoa ou global
- Preview de cálculo

### 7. Relatórios
- Abas: mensal, anual, por categoria, por pessoa, descontos, projeções
- Tabelas e gráficos mostrando bruto, dízimo, imposto, gasolina, líquido, despesas, saldo

### 8. Projeções
- Média dos últimos 3 e 6 meses
- Cenários: conservador (menor média), médio (média simples), otimista (melhores meses)
- Mostra bruto e líquido previstos

### 9. Configurações
- Gerenciar pessoas, categorias, percentuais padrão
- Moeda BRL, formato brasileiro (R$ 0,00)

## Design
- Mobile-first, visual limpo e profissional
- Cards com espaçamento generoso, leitura fácil
- Separação clara entre receitas e despesas
- Descontos sempre visíveis como parte da receita (não confundir com despesas)
- Cores por categoria
- Formato monetário brasileiro em todo o app

