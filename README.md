# Tuberculose no Brasil, 2015–2025 - SINAN

Projeto final da disciplina **Programação e Análise de Dados em Saúde** (Prof. Lucas Miguel de Carvalho).

**Discente:** Wagner Santos de Jesus

Análise dos casos de tuberculose notificados no Brasil entre 2015 e 2025, a partir dos microdados do **SINAN** (Ministério da Saúde/DATASUS), com:

- um **notebook** com todas as etapas do projeto (carregamento, qualidade, gráficos, funções próprias e duas análises);
- um **pipeline em Python** que transforma os microdados em indicadores agregados;
- um **painel interativo** (Vite + React) para explorar os indicadores por ano, região e UF;
- tudo orquestrado com **Docker Compose**.

## Arquitetura

```
                ┌──────────────── analytics/ (Python) ────────────────┐
 DATASUS (FTP)  │  baixar ─▶ leitura ─▶ preparo ─▶ indicadores ─▶ exportar │
 TUBEBRaa.dbc ─▶│     data/raw/*.dbc   data/processed/*.parquet          │
                │  notebooks/tuberculose_brasil.ipynb (análise do projeto)│
                └───────────────────────────┬─────────────────────────────┘
                                            │ escreve
                                            ▼
                               painel-dados/*.json   ◀── contrato de dados (só agregados)
                                            │ lê
                ┌───────────────────────────┴─────────────────────────────┐
                │  frontend/ (Vite + React + TypeScript) → nginx :8080     │
                └──────────────────────────────────────────────────────────┘
```

| Pasta | Responsabilidade | Tecnologia |
|---|---|---|
| `analytics/` | Download, leitura dos `.dbc`, limpeza, funções de análise, modelos, exportação dos JSON, notebook e testes | Python 3.13, pandas, statsmodels, JupyterLab, pytest |
| `painel-dados/` | **Contrato** entre os dois lados: JSON agregados por UF × ano (sem dados individuais) | JSON |
| `frontend/` | Painel interativo: filtros, indicadores, gráficos, mapa por UF, análises e qualidade dos dados | Vite, React 19, TypeScript, SVG próprio, nginx |

Os dois lados não importam código um do outro: o frontend só conhece o formato dos JSON (`frontend/src/data/types.ts`), e o analytics só sabe gravar esses arquivos (`analytics/src/tb_analytics/exportar.py`). Um teste (`analytics/tests/test_contrato_painel.py`) confere o contrato.

## Como executar (Docker)

Pré-requisito: [Docker Desktop](https://www.docker.com/products/docker-desktop/) (ou Docker Engine + Compose v2).

```bash
git clone https://github.com/[usuario]/tuberculose-sinan-brasil.git
cd tuberculose-sinan-brasil

# 1. Gera os dados do painel: baixa os 11 arquivos do DATASUS (~55 MB) e exporta os JSON (~3 min na 1ª vez)
docker compose --profile analytics run --rm analytics

# 2. Sobe o painel
docker compose up -d --build frontend
#    → http://localhost:8080
```

> Os JSON já gerados estão versionados em `painel-dados/`. Se quiser só ver o painel, o passo 2 basta.

Outros serviços:

| Comando | O que faz |
|---|---|
| `docker compose --profile notebook up --build notebook` | JupyterLab em http://localhost:8888 (token `tuberculose`) com o notebook do projeto |
| `docker compose --profile dev up frontend-dev` | Vite com recarga automática em http://localhost:5173 (para editar o painel) |
| `docker compose --profile analytics run --rm --entrypoint pytest analytics -q tests` | Testes do pacote Python |
| `docker compose --profile analytics run --rm analytics exportar` | Só regenera os JSON (sem tentar baixar) |
| `docker compose down` | Para o painel |

No Linux/macOS há atalhos no `Makefile`: `make dados`, `make painel`, `make notebook`, `make dev`, `make testes`.

Variáveis opcionais (arquivo `.env` na raiz): `PAINEL_PORTA` (padrão 8080), `NOTEBOOK_PORTA` (8888), `JUPYTER_TOKEN` (tuberculose), `UID` (1000 — use o seu `id -u` no Linux se der erro de permissão nas pastas montadas).

## Como executar (sem Docker)

```bash
# Analytics (Python 3.11+)
cd analytics
python -m venv .venv && source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
export PYTHONPATH=src                                   # Windows (PowerShell): $env:PYTHONPATH="src"
python -m tb_analytics pipeline                         # baixa e exporta para ../painel-dados
python -m pytest -q tests
jupyter lab notebooks/tuberculose_brasil.ipynb

# Frontend (Node 20.19+ ou 22+)
cd ../frontend
npm ci
npm run dev                                             # http://localhost:5173 (lê ../painel-dados)
```

**Download manual dos dados** (se o FTP estiver bloqueado na sua rede): baixe `TUBEBR15.dbc` … `TUBEBR25.dbc` em `ftp://ftp.datasus.gov.br/dissemin/publicos/SINAN/DADOS/` (pasta `FINAIS` para 2015–2019, `PRELIM` para 2020+) e coloque em `analytics/data/raw/`. Depois rode `exportar` em vez de `pipeline`.

## O painel

- **Painel** — filtros de ano e território (Brasil, região ou UF) que valem para tudo abaixo deles: casos novos, cura, abandono, óbito por TB, testagem para HIV, teste rápido molecular; série observada × esperada; desfechos com as metas (85% e 5%); mapa em grade por UF (clique para filtrar); tipo de entrada; pirâmide etária; agravos e raça/cor.
- **Análises** — A1 (impacto da COVID‑19) e A2 (fatores associados ao desfecho desfavorável: OR bruta e ajustada, efeito acumulado, tempo até o desfecho).
- **Qualidade dos dados** — completude por variável e ano (escore de Romero & Cunha).
- **Sobre** — fonte, definições e limitações.

Todo gráfico tem **“Ver tabela”** (acessibilidade), tooltip por teclado e mouse, e tema claro/escuro.

## Principais achados

- 850 mil casos novos em 11 anos; 69% homens, pico entre 20 e 30 anos.
- Em 2020–2021 houve **~22 mil casos novos a menos** que o esperado pela tendência pré‑pandemia (−13%), em todas as regiões.
- A **cura caiu de 71% para 65%** e o **abandono subiu de 11% para 15%** (2015→2023), longe das metas de 85% e 5%.
- Situação de rua (OR ajustada 3,25), uso de drogas (1,99), aids (1,69), baixa escolaridade (1,53), raça/cor preta (1,34) e sexo masculino (1,30) associam-se a maior chance de abandono ou óbito por TB.

## Dados e privacidade

- **Fonte:** SINAN Tuberculose — Ministério da Saúde/DATASUS. 1.068.921 notificações, 97 variáveis.
- **Status:** 2015–2019 finais; **2020–2025 preliminares** (o encerramento de 2024–2025 ainda está incompleto).
- Os microdados são públicos e anonimizados, mas **não são versionados**. O repositório guarda apenas **agregados** (`painel-dados/`).

## Limitações

Dados preliminares a partir de 2020; unidade de análise é a notificação (não a pessoa); sem denominador populacional (não há taxas de incidência); variáveis com muitos “ignorados”; desenho observacional (associação não é causalidade).

## Estrutura

```
.
├── docker-compose.yml
├── Makefile
├── painel-dados/                 # JSON agregados (contrato analytics → frontend)
├── analytics/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── src/tb_analytics/         # pacote Python (baixar, leitura, preparo, funcoes, indicadores, exportar)
│   ├── notebooks/tuberculose_brasil.ipynb
│   ├── tests/
│   ├── figuras/                  # gráficos do notebook
│   └── data/raw | data/processed # (não versionado)
└── frontend/
    ├── Dockerfile  nginx.conf
    ├── package.json  vite.config.ts  index.html
    └── src/
        ├── data/                 # tipos do contrato, carregamento e agregação
        ├── components/           # gráficos (linhas, barras, pirâmide, mapa, forest, boxplot)
        ├── views/                # Painel, Análises, Qualidade, Sobre
        └── lib/                  # formatação pt-BR, escalas, cores
```
