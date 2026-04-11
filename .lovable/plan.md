

# Recorrências da Cíntia no Dashboard — Dar Baixa Rápida

## Situação atual
- Cíntia tem **13 modelos recorrentes** (Personal Cintia), totalizando R$ 9.600/mês
- Nenhum lançamento foi gerado para abril/2026 — os modelos existem mas não foram convertidos em lançamentos
- Não há forma rápida no Dashboard de ver quais recorrências já foram pagas e dar baixa

## Solução: Seção "Recorrências Pendentes" no Dashboard

Adicionar uma seção logo abaixo da Previsão Salarial, agrupada por pessoa (ex: "Cíntia", "Octávio"), mostrando cada recorrência como um card compacto com botão de dar baixa rápida.

### Layout (mobile-first, 384px)

```text
┌─────────────────────────────┐
│ 👤 Cíntia — Personal        │
│ 8 de 13 pendentes           │
├─────────────────────────────┤
│ ✅ Amanda      R$ 1.200     │
│ ✅ Bento       R$   400     │
│ ⬜ Casal       R$ 1.600  [✓]│
│ ⬜ Dupla Blvd  R$   550  [✓]│
│ ⬜ Hiany       R$   720  [✓]│
│ ...                         │
└─────────────────────────────┘
```

- Cada item mostra nome, valor padrão e status (recebido/pendente)
- Botão de check ao lado para dar baixa instantânea (cria o lançamento com status "recebido")
- Items já recebidos ficam com check verde e texto riscado
- Possibilidade de editar o valor antes de confirmar (toque longo ou ícone de edição)
- Card colapsável para não ocupar muito espaço quando já viu tudo

### Fluxo ao dar baixa
1. Usuário toca no check de "Casal"
2. Sistema busca a regra da categoria (dízimo/imposto/gasolina)
3. Cria lançamento com `modelo_id` vinculado, status "recebido", mês/ano atuais
4. Atualiza a lista e a previsão salarial instantaneamente
5. Se o valor for variável (`modo_valor = 'variavel'`), abre mini-dialog para digitar o valor

### Alterações

1. **Novo componente `src/components/dashboard/RecorrenciasPendentes.tsx`**
   - Recebe `modelos` (recorrentes ativos) e `lancamentosMes` (lançamentos do mês)
   - Cruza por `modelo_id` para saber quais já foram lançados
   - Agrupa por pessoa (Cíntia, Octávio)
   - Renderiza lista compacta com toggle de dar baixa

2. **`src/pages/Dashboard.tsx`**
   - Importar e posicionar o novo componente após SalaryForecast
   - Passar `modelos`, `lancamentosMes`, `mes`, `ano` como props

3. **Lógica de dar baixa** (dentro do componente)
   - Reutiliza a mesma lógica de `launchEntry` do Dashboard (busca regra, calcula descontos, insere lançamento)
   - Vincula o `modelo_id` para que a previsão salarial reconheça como recorrência recebida

### Resultado esperado
- Ao abrir o Dashboard, o usuário vê imediatamente quais alunos da Cíntia já pagaram e quais faltam
- Um toque para dar baixa, sem navegar para outra tela
- A previsão salarial atualiza automaticamente conforme as baixas são dadas

