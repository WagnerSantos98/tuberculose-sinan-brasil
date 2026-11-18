# Frontend - Painel (Vite + React + TypeScript)

Lê os JSON de `../painel-dados/` (contrato descrito em `../analytics/README.md`) e não depende de nenhum código Python.

```bash
npm ci
npm run dev        # http://localhost:5173 — serve ../painel-dados em /data (ou a pasta em PAINEL_DADOS)
npm run build      # checa os tipos e gera dist/
npm run preview    # serve dist/ + /data em http://localhost:4173
```

Em produção (Docker) o `dist/` é servido pelo nginx e `painel-dados/` é montado em `/usr/share/nginx/html/data`, então regenerar os dados não exige rebuild da imagem.

## Organização

- `src/data/` — tipos do contrato (`types.ts`), carregamento (`carregar.ts`) e agregação do cubo por território/ano (`cubo.ts`)
- `src/components/` — gráficos em SVG próprio: linhas com cruzeta, barras, pirâmide, mapa em grade, forest plot, boxplot, colunas; cartão com alternância gráfico/tabela
- `src/views/` — abas Painel, Análises, Qualidade dos dados, Sobre
- `src/lib/` — formatação pt‑BR, escalas, cores, hook de largura

Sem bibliotecas de gráficos: as cores seguem uma paleta validada para daltonismo, com tema claro e escuro (`src/styles.css`).
