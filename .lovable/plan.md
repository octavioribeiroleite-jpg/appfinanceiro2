

# Atualizar Recorrências da Cíntia — Migração SQL

## Alterações necessárias (1 migração)

### Atualizações de valor e dia
| Aluno | Valor | Dia |
|-------|-------|-----|
| Amanda | 1400 | 3 |
| João | 840 | 25 |
| Patricia | 840 | 10 |
| Bento | (manter) | 13 |
| Mayara | (manter) | 9 |
| Morada | (manter) | 10 |
| Laura | (manter) | 12 |
| Irleis | (manter) | 13 |
| Casal | (manter) | 25 |
| Thais | (manter) | 16 |
| Dupla Boulevard | (manter) | 3 |

### Hiany — dividir em 2 parcelas
- Atualizar registro existente: descricao "Hiany (1ª)", valor 420, dia 10
- Criar novo registro: descricao "Hiany (2ª)", valor 420, dia 26, copiando user_id, pessoa_id, categoria_id e configs

### Remover Thiago
- Deletar o registro do Thiago

### Resultado final
- 12 alunos, 13 registros (Hiany 2x)
- Total: R$ 9.540/mês
- Todos com dia de referência correto

### Implementacao
Uma migração SQL com todos os UPDATEs, INSERT da Hiany (2ª) e DELETE do Thiago, usando os IDs existentes no banco.

