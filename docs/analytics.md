# Analytics - Pipeline e análises 

Pacote `tb_analytics` + notebook do projeto.

| Módulo | Função |
|---|---|
| `config.py` | Caminhos e anos (sobrescrevíveis por `TB_DADOS_BRUTOS`, `TB_DADOS_PROCESSADOS`, `TB_SAIDA_PAINEL`) |
| `baixar.py` | Baixa `TUBEBRaa.dbc` do FTP do DATASUS (FINAIS, senão PRELIM); pula os que já existem |
| `leitura.py` | `.dbc` → DataFrame (texto), com cache Parquet em `data/processed/` |
| `dicionario.py` | Códigos do SINAN → rótulos |
| `preparo.py` | Duplicatas, datas inválidas, idade, recodificação, variáveis derivadas, escore Z |
| `funcoes.py` | `avaliar_incompletude` e `comparar_desfecho` (as funções da Etapa 4) |
| `indicadores.py` | Cubo UF × ano, A1 (tendência), A2 (regressão logística), tempo de tratamento, completude |
| `exportar.py` | Grava os JSON em `painel-dados/` |

```bash
export PYTHONPATH=src
python -m tb_analytics baixar     # só download
python -m tb_analytics exportar   # só exportação
python -m tb_analytics pipeline   # os dois
python -m pytest -q tests
```

O notebook `notebooks/tuberculose_brasil.ipynb` é a entrega acadêmica: ele é autocontido (mostra o código de cada etapa) e usa a mesma lógica do pacote. Os números do painel e do notebook coincidem.

## Contrato `painel-dados/` (versão 1)

| Arquivo | Conteúdo |
|---|---|
| `meta.json` | Anos, status (final/preliminar), metas, UFs, resumo e definições |
| `cubo_uf_ano.json` | `{campos, linhas}`: contagens por UF de residência × ano (casos novos, tipos de entrada, encerramentos, sexo × faixa etária, raça/cor, agravos, HIV, TRM) |
| `a1_tendencia.json` | Observado, esperado e IP 95% para Brasil (`BR`), regiões (`R:<nome>`) e UFs (`UF:<sigla>`) |
| `a2_fatores.json` | Coorte, OR brutas + qui‑quadrado, OR ajustadas, gradiente de vulnerabilidades |
| `tempo_tratamento.json` | Estatísticas de boxplot por desfecho |
| `completude.json` | % de incompletude por variável e ano |