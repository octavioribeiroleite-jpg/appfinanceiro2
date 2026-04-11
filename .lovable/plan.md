

# Adicionar "Restante a Receber" na Previsao Salarial

## Situacao atual
- Previsao = R$ 9.600 (soma dos 13 modelos recorrentes ativos)
- Recebido recorrente = R$ 0 (nenhum lancamento de abril tem `modelo_id`)
- Avulsos = R$ 5.018,20 (10 lancamentos avulsos)
- Total mes = R$ 14.618,20 / Recebido = R$ 5.018,20
- **Restante a receber = R$ 9.600,00** (todas as recorrencias pendentes)

## Sobre o calendario
O app nao usa um calendario visual — usa selects de mes/ano. O componente `Calendar` existe mas nao esta integrado. Se quiser um calendario visual no Dashboard, posso adicionar, mas o seletor atual esta funcionando corretamente com os meses em portugues (Janeiro-Dezembro).

## Plano

### 1. Adicionar linha "Restante a receber" no SalaryForecast
- Calcular `restante = totalMes - totalRecebido`
- Exibir entre o total recebido e a barra de progresso
- Mostrar em cor amber/laranja para destaque
- Mostrar quantos dias faltam no mes atual

### Arquivo modificado
- `src/components/dashboard/SalaryForecast.tsx` — adicionar calculo do restante, linha visual com valor e dias restantes no mes

