

# Atualizar lançamentos existentes ao salvar regras

## Problema
Quando o usuário altera as porcentagens de dízimo/imposto/gasolina nas Regras, os lançamentos existentes ficam com os valores antigos. Precisa recalcular todos automaticamente.

## Solução

Modificar **`src/pages/Regras.tsx`** — na função `handleSave`, após salvar a regra com sucesso:

1. Buscar todos os lançamentos de receita que usam a mesma `categoria_id` (e `pessoa_id` se aplicável)
2. Para cada lançamento, recalcular `valor_dizimo`, `valor_imposto`, `valor_gasolina` e `valor_liquido` com as novas porcentagens
3. Fazer um update em batch de todos os lançamentos afetados
4. Invalidar queries de lançamentos para atualizar a UI
5. Mostrar toast informando quantos lançamentos foram atualizados

### Lógica de recálculo por lançamento:
```text
valor_dizimo = aplicar_dizimo ? valor_bruto * percentual_dizimo / 100 : 0
valor_imposto = aplicar_imposto ? valor_bruto * percentual_imposto / 100 : 0
valor_gasolina = aplicar_gasolina ? valor_bruto * percentual_gasolina / 100 : 0
valor_liquido = valor_bruto - valor_dizimo - valor_imposto - valor_gasolina
```

Também atualizar os campos `percentual_*` e `aplicar_*` em cada lançamento para refletir a regra atual.

## Arquivo a modificar
- **`src/pages/Regras.tsx`** — Expandir `handleSave` para recalcular e atualizar lançamentos existentes

