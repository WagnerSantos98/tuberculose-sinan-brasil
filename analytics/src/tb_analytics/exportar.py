# Gera os arquivos JSON consumidos pelo painel
import json
import time
from datetime import datetime, timezone
from pathlib import Path
from . import config, indicadores
from .dicionario import NOME_UF, ORDEM_REGIOES, REGIAO, UF
from .leitura import carregar_sinan_tb
from .preparo import preparar

VERSAO_CONTRATO = 1

def _gravar(pasta: Path, nome: str, obj) -> None:
    caminho = pasta / nome
    caminho.write_text(json.dumps(obj, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"[exportar] {nome:24s} {caminho.stat().st_size / 1024:8.1f} KB")
    
def exportar(saida: Path = config.SAIDA_PAINEL) -> None:
    t0 = time.time()
    saida = Path(saida)
    saida.mkdir(parents=True, exist_ok=True)
    print("[exportar] carregando dados ...")
    bruto = carregar_sinan_tb()
    tb = preparar(bruto)
    print(f"[exportar] base analítica: {len(tb):,} registros".replace(",", "."))

    anos = sorted(tb["ano_diag"].unique().tolist())
    meta = {
        "versao_contrato": VERSAO_CONTRATO,
        "gerado_em": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "fonte": "SINAN Tuberculose — Ministério da Saúde / DATASUS (microdados TUBEBRaa.dbc)",
        "anos": anos,
        "status_por_ano": {str(a): ("final" if a <= config.ULTIMO_ANO_FINAL else "preliminar") for a in anos},
        "ultimo_ano_desfecho": config.ULTIMO_ANO_DESFECHO,
        "metas": {"cura": 85, "abandono": 5},
        "regioes": ORDEM_REGIOES,
        "ufs": [{"sigla": s, "nome": NOME_UF[s], "regiao": REGIAO[c[0]]} for c, s in UF.items()],
        "resumo": indicadores.resumo_bruto(bruto, tb),
        "definicoes": {
            "caso_novo": "Tipo de entrada caso novo, não sabe ou pós-óbito (critério do Ministério da Saúde).",
            "indicadores_encerramento": "Calculados entre casos novos de TB pulmonar, por UF de residência e ano "
                                        "de diagnóstico; denominador inclui casos sem encerramento.",
            "abandono": "Abandono + abandono primário.",
            "desfecho_desfavoravel": "Abandono, abandono primário ou óbito por TB, comparado à cura.",
        },
    }
    del bruto
    
    _gravar(saida, "meta.json", meta)
    _gravar(saida, "cubo_uf_ano.json", indicadores.cubo_uf_ano(tb))
    _gravar(saida, "a1_tendencia_json", indicadores.a1_tendencia(tb))
    _gravar(saida, "a2_fatores.json", indicadores.a2_fatores(tb))
    _gravar(saida, "tempo_tratamento.json", indicadores.tempo_tratamento(tb))
    _gravar(saida, "completude.json", indicadores.completude(tb))
    print(f"[exportar] concluído em {time.time() - t0:.0f} s -> {saida.resolve()}") 