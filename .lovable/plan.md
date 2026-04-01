

# Adicionar alunos da Cíntia como renda recorrente

## Situação atual
O app **já tem consolidação automática** de pagamentos recorrentes. A página "Recorrências" permite criar modelos que geram lançamentos automáticos todo mês via a função `gerar_recorrencias_mensais`. Ou seja, ao cadastrar cada aluno como modelo recorrente, o sistema já cria os lançamentos automaticamente a cada mês.

## O que será feito

### 1. Inserir 12 modelos recorrentes (via insert no banco)
Cada aluno será cadastrado como modelo recorrente vinculado à categoria **Personal esposa** e pessoa **Esposa**:

| Aluno | Valor |
|-------|-------|
| Bento | R$ 400 |
| Mayara | R$ 560 |
| Hiany | R$ 720 |
| Patricia | R$ 720 |
| Morada | R$ 500 |
| Laura | R$ 720 |
| Irleis | R$ 400 |
| Casal | R$ 1.600 |
| João | R$ 500 |
| Thiago | R$ 840 |
| Amanda | R$ 1.200 |
| Dupla Boulevard | R$ 550 |

Configuração: tipo `receita`, recorrência `mensal`, modo valor `editavel` (para poder ajustar se necessário), gerar automaticamente = `true`.

### 2. Criar atalhos rápidos para cada aluno
Para aparecerem no Dashboard agrupados sob "Personal esposa", cada aluno também terá um atalho rápido com o valor padrão.

### 3. O que já funciona (não precisa mexer)
- **Consolidação automática**: O botão "Gerar Recorrências" na página Recorrências já chama `gerar_recorrencias_mensais` que cria os lançamentos do mês
- **Edição/exclusão**: A página Recorrências já permite ativar/desativar modelos
- **Previsão salarial**: O Dashboard já soma os modelos ativos na previsão

## Execução técnica
- Buscar os IDs da categoria "Personal esposa" e pessoa "Esposa" do usuário logado
- Inserir os 12 registros em `modelos_recorrentes` e `atalhos_rapidos` via insert SQL
- Nenhuma alteração de código necessária — apenas dados

