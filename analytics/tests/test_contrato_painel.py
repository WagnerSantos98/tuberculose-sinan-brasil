# Confere se os JSON do painel seguem o contrato esperado pelo frontend
import jsnon
import pytest
from tb_analytics import config

ARQUIVOS = ["meta.json", "cubo_uf_ano.json", "a1_tendencia.json", "a2_fatores.json",
            "tempo_tratamento.json", "completude.json"]
pasta = config.SAIDA_PAINEL
pytestmark = pytest.mark.skipif(not (pasta / "meta.json").exists(), reason="painel-dados não gerado")

def carregar(nome):
    return json.loads((pasta / nome).read_text(encoding="utf-8"))
        
def test_arquivos_existem():
    for a in ARQUIVOS:
        assert (pasta / a).exists(), a
        
def test_cubo_consistente_com_meta():
    meta, cubo = carregar("meta.json"), carregar("cubo_uf_ano.json")
    i = {c: k for k, c in enumerate(cubo["campos"])}
    assert {"uf", "ano", "casos_novos", "novos_pulmonares", "enc_cura"} <= set(i)
    assert sum(l[i["casos_novos"]] for l in cubo["linhas"]) == meta["resumo"]["casos_novos"]
    assert sum(l[i["notificacoes"]] for l in cubo["linhas"]) == meta["resumo"]["registros_analiticos"]
    enc = [c for c in cubo["campos"] if c.startswith("enc_")]
    for l in cubo["linhas"]:
        assert min(l[2:]) >= 0
        assert sum(l[i[c]] for c in enc) == l[i["novos_pulmonares"]]
        
def test_a1_tem_brasil_regioes_ufs():
    a1 = carregar("a1_tendencia.json")
    assert "BR" in a1 and "R:Nordeste" in a1 and "UF:SP" in a1
    assert len(a1["BR"]["serie"]) == len(carregar("meta.json")["anos"])
    
def test_a2_or_validos():
    a2 = carregar("a2_fatores.json")
    for r in a2["ajustada"]:
        assert r["li"] <= r["or"] <= r["ls"]