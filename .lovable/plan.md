

# Tornar o app instalável (Add to Home Screen)

Abordagem recomendada: **manifest.json simples** (sem service workers), que permite instalar o app na tela inicial do celular sem riscos no editor.

## O que será feito

1. **Criar `public/manifest.json`** com nome "Controle Familiar", cores do app (#3B82F6), display standalone, ícones
2. **Criar ícones** (192x192 e 512x512) — usar SVG inline ou placeholder
3. **Adicionar `<link rel="manifest">` e meta tags** no `index.html` (theme-color, apple-mobile-web-app-capable)

## O que NÃO será feito
- Sem `vite-plugin-pwa`
- Sem service workers
- Sem cache offline

Isso é suficiente para o app aparecer como instalável no navegador mobile e funcionar em tela cheia como um app nativo.

