

# Padronizar Layout e Responsividade do App

## Problemas Identificados

1. **Header e navegacao inconsistentes**: O AppLayout usa navegacao bottom-bar no mobile com overlay "Mais", mas pode cortar em telas pequenas
2. **Espacamento sem padrao**: Cada pagina define seus proprios gaps, paddings e grid layouts de formas diferentes
3. **Tipografia inconsistente**: Titulos variam entre `text-2xl`, `text-base`, `text-lg` sem hierarquia clara
4. **Cards sem padrao**: Padding varia entre `p-3`, `p-4`, `p-6` em diferentes paginas
5. **Filtros desordenados**: Na tela de Lancamentos, 6 selects em grid cortam em mobile
6. **Desktop offset manual**: O `margin-left: 14rem` e feito via tag `<style>` inline, fragil
7. **Formularios sem consistencia**: NovoLancamento usa `max-w-lg mx-auto`, outras paginas nao

## Plano de Padronizacao

### 1. Criar componente `PageContainer` reutilizavel
- Wrapper padrao para todas as paginas com titulo, subtitulo opcional e acoes
- Espacamento consistente: `space-y-6` entre secoes
- Titulo sempre