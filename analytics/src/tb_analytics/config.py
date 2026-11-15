# Caminhos do pipeline. Podem ser trocados por variáveis de ambiente
import os
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]          

DADOS_BRUTOS = Path(os.environ.get("TB_DADOS_BRUTOS", RAIZ / "data" / "raw"))
DADOS_PROCESSADOS = Path(os.environ.get("TB_DADOS_PROCESSADOS", RAIZ / "data" / "processed"))
SAIDA_PAINEL = Path(os.environ.get("TB_SAIDA_PAINEL", RAIZ.parent / "painel-dados"))

ANO_INICIAL = int(os.environ.get("TB_ANO_INICIAL", 2015))
ANO_FINAL = int(os.environ.get("TB_ANO_FINAL", 2025))
ULTIMO_ANO_FINAL = 2019        
ULTIMO_ANO_DESFECHO = 2023       
