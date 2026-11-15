# Testes das funções próprias com dados sintéticos
import numpy as np
import pandas as pd
import pytest
from tb_analytics.funcoes import avaliar_incompletude, classificar_incompletude, comparar_desfecho
from tb_analytics.preparo import decodificar_idade

def test_classificacao_romero_cunha():
    assert classificar_incompletude(0) == "Excelente"
    assert classificar_incompletude(4.99) == "Excelente"
    assert classificar_incompletude(5) == "Bom"
    assert classificar_incompletude(15) == "Regular"
    assert classificar_incompletude(30) == "Ruim"
    assert classificar_incompletude(50) == "Muito ruim"

def test_avaliar_incompletude_conta_vazio_e_ignorado():
    df = pd.DataFrame({"x": ["Sim", "Não", "Ignorado", None, "Sim", "Não", "Sim", "Não", "Sim", "Não"],
                       "g": [1] * 5 + [2] * 5})
    r = avaliar_incompletude(df, ["x"])
    assert r.loc["x", "% vazio"] == pytest.approx(10)
    assert r.loc["x", "% ignorado"] == pytest.approx(10)
    assert r.loc["x", "% incompleto"] == pytest.approx(20)
    assert r.loc["x", "classificação"] == "Ruim"
    por = avaliar_incompletude(df, ["x"], por="g")
    assert por.loc["x", 1] == pytest.approx(40) and por.loc["x", 2] == pytest.approx(0)

def test_comparar_desfecho_or_e_qui2():
    df = pd.DataFrame({"grupo": ["Sim"] * 100 + ["Não"] * 100,
                       "y": [1] * 30 + [0] * 70 + [1] * 10 + [0] * 90})
    r = comparar_desfecho(df, "grupo", desfecho="y", referencia="Não")
    assert r.loc[("grupo", "Sim"), "OR bruta"] == pytest.approx(30 * 90 / (70 * 10))
    assert r.loc[("grupo", "Sim"), "% desfecho"] == pytest.approx(30)
    assert r.loc[("grupo", "Não"), "OR bruta"] == 1.0
    lo, hi = r.loc[("grupo", "Sim"), ["IC95% inf", "IC95% sup"]]
    assert lo < 3.857 < hi
    assert r.attrs["p"] < 0.001 and r.attrs["gl"] == 1

def test_comparar_desfecho_exclui_ignorado():
    df = pd.DataFrame({"grupo": ["Sim", "Não", "Ignorado", "Não"], "y": [1, 0, 1, 1]})
    r = comparar_desfecho(df, "grupo", desfecho="y", referencia="Não")
    assert "Ignorado" not in r.index.get_level_values("categoria")

def test_decodificar_idade():
    s = pd.Series(["4052", "3006", "2010", "4115", None, "9999"], dtype="string")
    out = decodificar_idade(s).astype(float).tolist()
    assert out[0] == 52 and out[1] == 0 and out[2] == 0
    assert np.isnan(out[3]) and np.isnan(out[4]) and np.isnan(out[5])