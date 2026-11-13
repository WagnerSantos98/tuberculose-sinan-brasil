# Limpeza, recodificação e criação de variáveis
import numpy as np
import pandas as pd
from .dicionario import BINARIAS, DIC, FAIXAS, REGIAO, SIM_NAO, UF

# Função de conversão de texto em data; anos fora de 2010-2026 viram NaT
def para_data(s: pd.Series) -> pd.Series:
    d = pd.to_datetime(s, errors="coerce")
    return d.where(d.dt.year.between(2010, 2026))

# Função para NU_IDADE_N -> idade em anos. Unidade 4 = anos; 1/2/3 (horas/dias/meses) = 0 ano; >110 = NA
def decodificar_idade(s: pd.Series) -> pd.Series:
    unidade, valor = s.str[0], pd.to_numeric(s.str[1:], errors="coerce").astype("Float64")
    idade = valor.where(unidade == "4")
    idade = idade.mask(unidade.isin(["1", "2", "3"]), 0)
    return idade.where(idade <= 110)


# Função para receber o DataFrame bruto do SINAN e devolver a base analítica
def preparar(bruto: pd.DataFrame) -> pd.DataFrame:
    b = bruto.drop_duplicates().reset_index(drop=True)
    tb = pd.DataFrame({
        "ano_diag": b["ARQUIVO_ANO"].astype(int),
        "status_base": b["STATUS_BASE"],
        "dt_diag": para_data(b["DT_DIAG"]),
        "dt_inicio": para_data(b["DT_INIC_TR"]),
        "dt_encerra": para_data(b["DT_ENCERRA"]),
        "uf": b["SG_UF"].map(UF),
        "regiao": b["SG_UF"].str[0].map(REGIAO).where(b["SG_UF"].isin(UF.keys())),
        "idade": decodificar_idade(b["NU_IDADE_N"]),
        "sexo": b["CS_SEXO"].map(DIC["CS_SEXO"]),
        "raca": b["CS_RACA"].map(DIC["CS_RACA"]),
        "escolaridade": b["CS_ESCOL_N"].map(DIC["CS_ESCOL_N"]),
        "tipo_entrada": b["TRATAMENTO"].map(DIC["TRATAMENTO"]),
        "forma": b["FORMA"].map(DIC["FORMA"]),
        "hiv_teste": b["HIV"].map(DIC["HIV"]),
        "baciloscopia": b["BACILOSC_E"].map(DIC["BACILOSC_E"]),
        "teste_molecular": b["TEST_MOLEC"].map(DIC["TEST_MOLEC"]),
        "encerramento": b["SITUA_ENCE"].str.lstrip("0").map(DIC["SITUA_ENCE"])
    })
    for orig, novo in BINARIAS.items():
        tb[novo] = b[orig].map(SIM_NAO)
        
    tb["faixa_etaria"] = pd.cut(tb["idade"].astype(float), bins=[-1, 14, 24, 34, 44, 54, 64, 200], labels=FAIXAS)
    tb["caso_novo"] = tb["tipo_entrada"].isin(["Caso novo", "Não sabe", "Pós-óbito"])
    tb["pulmonar"] = tb["forma"].isin(["Pulmonar", "Pulmonar + extrapulmonar"])
    tempo = (tb["dt_encerra"] - tb["dt_inicio"]).dt.days
    tb["tempo_trat_dias"] = tempo.where(tempo.between(0, 730))
    tb["desfecho_desfav"] = np.select(
        [tb["encerramento"].isin(["Abandono", "Abandono primário", "Óbito por TB"]), tb["encerramento"] == "Cura"],
        [1.0, 0.0], default=np.nan)
    tb = tb[tb["encerramento"] != "Mudança de diagnóstico"].reset_index(drop=True)
    idade = tb["idade"].astype(float)
    tb["idade_z"] = (idade - idade.mean()) / idade.std()
    return tb