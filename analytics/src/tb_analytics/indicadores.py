# Agregados e modelos que alimentam o painel (contagens por UF × ano, proporções, coeficientes)
import re
import numpy as np
import pandas as pd
import statsmodels.api as sm
import statsmodels.formula.api as smf
from . import config
from .dicionario import BINARIAS, FAIXAS, ORDEM_REGIOES
from .funcoes import avaliar_incompletude, classificar_incompletude, comparar_desfecho

TIPOS = {"Caso novo": "tipo_caso_novo", "Recidiva": "tipo_recidiva", "Reingresso após abandono": "tipo_reingresso",
         "Não sabe": "tipo_nao_sabe", "Transferência": "tipo_transferencia", "Pós-óbito": "tipo_pos_obito"}
ENCERRAMENTOS = {"enc_cura": ["Cura"], "enc_abandono": ["Abandono", "Abandono primário"],
                 "enc_obito_tb": ["Óbito por TB"], "enc_obito_outras": ["Óbito por outras causas"],
                 "enc_transferencia": ["Transferência"], "enc_tbdr": ["TB-DR"],
                 "enc_outros": ["Mudança de esquema", "Falência"]}
RACAS = {"raca_branca": "Branca", "raca_preta": "Preta", "raca_parda": "Parda", "raca_amarela": "Amarela",
         "raca_indigena": "Indígena"}
HIV = {"hiv_pos": "Positivo", "hiv_neg": "Negativo", "hiv_andamento": "Em andamento", "hiv_nao_realizado": "Não realizado"}
TRM_REALIZADO = ["Detectável, sensível RIF", "Detectável, resistente RIF", "Não detectável", "Inconclusivo"]

# Função para float JSON-seguro (NaN -> None)
def _f(x, nd=4):
    return None if x is None or(isinstance(x, float) and not np.isfinite(x)) else round(float(x), nd)

# Função de Cubo UF x ano (contagens por UF de residência e ano de diagnóstico)
def cubo_uf_ano(tb: pd.DataFrame) -> dict:
    novo = tb["caso_novo"]
    pulm = novo & tb["pulmonar"]
    ind= pd.DataFrame({"uf": tb["uf"].astype("string").fillna("NI"), "ano": tb["ano_diag"]})
    ind["notificacoes"] = 1
    for rot, col in TIPOS.items():
        ind[col] = (tb["tipo_entrada"] == rot)
    ind["casos_novos"] = novo
    ind["novos_pulmonares"] = pulm
    for col, cats in ENCERRAMENTOS.items():
        ind[col] = pulm & tb["encerramento"].isin(cats)
    ind["enc_sem_info"] = pulm & tb["encerramento"].isna()
    for s, letra in [("Masculino", "m"), ("Feminino", "f")]:
        for i, fx in enumerate(FAIXAS):
            ind[f"{letra}{i}"] = novo & (tb["sexo"] == s) & (tb["faixa_etaria"] == fx)
    for col, rot in RACAS.items():
        ind[col] = novo & (tb["raca"] == rot)
    ind["raca_ign"] = novo & ~tb["raca"].isin(RACAS.values())
    for v in BINARIAS.values():
        ind[f"{v}_sim"] = novo & (tb[v] == "Sim")
        ind[f"{v}_val"] = novo & tb[v].isin(["Sim", "Não"])
    for col, rot in HIV.items():
        ind[col] = novo & (tb["hiv_teste"] == rot)
    ind["trm_realizado"] = pulm & tb["teste_molecular"].isin(TRM_REALIZADO)
    ind["trm_valido"] = pulm & tb["teste_molecular"].notna()

    agg = ind.groupby(["uf", "ano"]).sum().astype(int).reset_index().sort_values(["ano", "uf"])
    campos = list(agg.columns)
    return {"campos": campos, "linhas": agg.values.tolist()}

# Funções A1 - tendência pré-pandemia e razão observado/esperado
def esperado_pre_pandemia(contagem_anual: pd.Series, anos_base=range(2015, 2020)):
    y = contagem_anual.reindex(list(anos_base)).astype(float)
    X = sm.add_constant(np.array(list(anos_base), dtype=float))
    modelo = sm.OLS(y.values, X).fit()
    anos = contagem_anual.index.values.astype(float)
    pred = modelo.get_prediction(sm.add_constant(anos, has_constant="add")).summary_frame(alpha=.05)
    out = pd.DataFrame({"observado": contagem_anual.values, "esperado": pred["mean"].values,
                        "ip_inf": pred["obs_ci_lower"].values, "ip_sup": pred["obs_ci_upper"].values},
                       index=contagem_anual.index)
    out["oe"] = out["observado"] / out["esperado"]
    return out, modelo

def a1_tendencia(tb: pd.DataFrame) -> dict:
    novos = tb[tb["caso_novo"]]
    grupos = {"BR": novos}
    grupos.update({f"R:{r}": novos[novos["regiao"] == r] for r in ORDEM_REGIOES})
    grupos.update({f"UF:{u}": d for u, d in novos.groupby(novos["uf"].astype("string")) if pd.notna(u)})
    saida = {}
    anos = list(range(config.ANO_INICIAL, config.ANO_FINAL + 1))
    for chave, d in grupos.items():
        cont = d.groupby("ano_diag").size().reindex(anos, fill_value=0)
        tab, mod = esperado_pre_pandemia(cont)
        deficit = (tab.loc[[2020, 2021], "observado"] - tab.loc[[2020, 2021], "esperado"]).sum()
        saida[chave] = {
            "inclinacao": _f(mod.params[1], 2), "r2": _f(mod.rsquared), "p": _f(mod.pvalues[1], 6),
            "deficit_2020_2021": _f(deficit, 1),
            "deficit_pct": _f(deficit / tab.loc[[2020, 2021], "esperado"].sum() * 100, 2),
            "serie": [{"ano": int(a), "observado": int(r.observado), "esperado": _f(r.esperado, 1),
                       "ip_inf": _f(r.ip_inf, 1), "ip_sup": _f(r.ip_sup, 1), "oe": _f(r.oe)}
                      for a, r in tab.iterrows()],
        }
    return saida

# A2 - fatores associados ao desfecho desfavorável
FATORES = {"sexo": ("Sexo", "Feminino"), "faixa_etaria": ("Faixa etária", "35–44"),
           "raca4": ("Raça/cor", "Branca"), "escolaridade": ("Escolaridade", "Médio completo ou mais"),
           "aids": ("Aids", "Não"), "alcool": ("Alcoolismo", "Não"), "drogas": ("Drogas ilícitas", "Não"),
           "tabagismo": ("Tabagismo", "Não"), "diabetes": ("Diabetes", "Não"),
           "doenca_mental": ("Doença mental", "Não"), "pop_rua": ("Situação de rua", "Não"),
           "pop_liberdade": ("Privado de liberdade", "Não"), "benef_gov": ("Benef. transferência de renda", "Não")}

# Funções para casos novos pulmonares 2015–2023 com desfecho cura (0) ou desfavorável (1)
def coorte_desfecho(tb: pd.DataFrame) -> pd.DataFrame:
    c = tb[tb["caso_novo"] & tb["pulmonar"] & tb["ano_diag"].between(config.ANO_INICIAL, config.ULTIMO_ANO_DESFECHO) & tb["desfecho_desfav"].notna()].copy()
    c["raca4"] = c["raca"].astype("string").replace({"Amarela": "Amarela/Indígena", "Indígena": "Amarela/Indígena"})
    c["faixa_etaria"] = c["faixa_etaria"].astype("string")
    return c

def a2_fatores(tb: pd.DataFrame) -> dict:
    c = coorte_desfecho(tb)
    biv, testes = [], []
    for var, (rotulo, ref) in FATORES.items():
        r = comparar_desfecho(c, var, referencia=ref, excluir=("Ignorado", "Não se aplica"))
        testes.append({"variavel": var, "rotulo": rotulo, **{k: _f(v, 8) for k, v in r.attrs.items()}})
        for (_, cat), row in r.iterrows():
            biv.append({"variavel": var, "rotulo": rotulo, "categoria": str(cat), "n": int(row["n"]),
                        "pct": _f(row["% desfecho"], 2), "or": _f(row["OR bruta"]),
                        "li": _f(row["IC95% inf"]), "ls": _f(row["IC95% sup"]), "ref": row["ref"] == "ref."})

    vars_mod = ["sexo", "idade_z", "raca4", "escolaridade", "aids", "alcool", "drogas", "tabagismo", "diabetes",
                "doenca_mental", "pop_rua", "pop_liberdade"]
    m = c[["desfecho_desfav"] + vars_mod].copy()
    for v in vars_mod:
        if v != "idade_z":
            m[v] = m[v].astype("string")
            m = m[~m[v].isin(["Ignorado", "Não se aplica"])]
    m = m.dropna()
    formula = ("desfecho_desfav ~ C(sexo, Treatment('Feminino')) + idade_z + I(idade_z**2)"
               " + C(raca4, Treatment('Branca')) + C(escolaridade, Treatment('Médio completo ou mais'))"
               + "".join(f" + C({v}, Treatment('Não'))" for v in vars_mod[4:]))
    logit = smf.logit(formula, data=m).fit(disp=False)
    ic = logit.conf_int()
    ajust = []
    for termo in logit.params.index.drop("Intercept"):
        if termo == "idade_z":
            var, cat = "idade_z", "+1 desvio-padrão"
        elif termo.startswith("I(idade"):
            var, cat = "idade_z2", "termo quadrático"
        else:
            var, cat = re.match(r"C\((\w+),.*\)\[T\.(.+)\]", termo).groups()
        ajust.append({"variavel": var, "rotulo": FATORES.get(var, ("Idade", ""))[0], "categoria": cat,
                      "referencia": FATORES.get(var, ("", None))[1],
                      "or": _f(np.exp(logit.params[termo])), "li": _f(np.exp(ic.loc[termo, 0])),
                      "ls": _f(np.exp(ic.loc[termo, 1])), "p": _f(logit.pvalues[termo], 10)})

    m["n_vulnerab"] = (m[["alcool", "drogas", "pop_rua", "aids"]] == "Sim").sum(axis=1)
    m["prev"] = logit.predict(m)
    grad = m.groupby("n_vulnerab").agg(n=("desfecho_desfav", "size"), pct=("desfecho_desfav", "mean"),
                                       previsto=("prev", "mean"))
    enc = c["encerramento"].value_counts()
    return {
        "coorte": {"n": int(len(c)), "pct_desfavoravel": _f(c["desfecho_desfav"].mean() * 100, 2),
                   "anos": [config.ANO_INICIAL, config.ULTIMO_ANO_DESFECHO],
                   "composicao": {k: int(v) for k, v in enc[enc > 0].items()}},
        "modelo": {"n": int(logit.nobs), "pseudo_r2": _f(logit.prsquared),
                   "idade_media": _f(c["idade"].astype(float).mean(), 2),
                   "idade_vertice": _f(tb["idade"].astype(float).mean() - logit.params["idade_z"]
                                       / (2 * logit.params["I(idade_z ** 2)"]) * tb["idade"].astype(float).std(), 1)},
        "bivariada": biv, "testes": testes, "ajustada": ajust,
        "gradiente": [{"n_vulnerabilidades": int(k), "n": int(r.n), "pct": _f(r.pct * 100, 2),
                       "previsto": _f(r.previsto * 100, 2)} for k, r in grad.iterrows()],
    }
    
# Funções de tratamento (boxplot) e completude
def tempo_tratamento(tb: pd.DataFrame) -> list:
    c = tb[tb["caso_novo"] & tb["pulmonar"] & tb["ano_diag"].between(config.ANO_INICIAL, config.ULTIMO_ANO_DESFECHO)]
    saida = []
    for enc in ["Cura", "Abandono", "Óbito por TB", "Óbito por outras causas", "Transferência", "TB-DR", "Falência"]:
        x = c.loc[c["encerramento"] == enc, "tempo_trat_dias"].dropna()
        q1, med, q3 = np.percentile(x, [25, 50, 75])
        iqr = q3 - q1
        saida.append({"desfecho": enc, "n": int(len(x)), "q1": _f(q1, 1), "mediana": _f(med, 1), "q3": _f(q3, 1),
                      "min": _f(x[x >= q1 - 1.5 * iqr].min(), 1), "max": _f(x[x <= q3 + 1.5 * iqr].max(), 1)})
    return saida

VARS_QUALIDADE = {"sexo": "Sexo", "idade": "Idade", "raca": "Raça/cor", "escolaridade": "Escolaridade",
                  "forma": "Forma clínica", "hiv_teste": "Teste de HIV", "aids": "Aids", "alcool": "Alcoolismo",
                  "drogas": "Drogas ilícitas", "tabagismo": "Tabagismo", "diabetes": "Diabetes",
                  "doenca_mental": "Doença mental", "pop_rua": "Situação de rua",
                  "pop_liberdade": "Privado de liberdade", "benef_gov": "Benef. transferência de renda",
                  "teste_molecular": "Teste rápido molecular", "encerramento": "Encerramento",
                  "dt_inicio": "Data de início do tratamento"}

def completude(tb: pd.DataFrame) -> dict:
    novos = tb[tb["caso_novo"]]
    cols = list(VARS_QUALIDADE)
    geral = avaliar_incompletude(novos, cols)
    por_ano = avaliar_incompletude(novos, cols, por="ano_diag")
    return {"variaveis": [{"variavel": v, "rotulo": VARS_QUALIDADE[v],
                           "pct_vazio": _f(geral.loc[v, "% vazio"], 2), "pct_ignorado": _f(geral.loc[v, "% ignorado"], 2),
                           "pct_incompleto": _f(geral.loc[v, "% incompleto"], 2),
                           "classificacao": geral.loc[v, "classificação"],
                           "por_ano": {str(a): _f(por_ano.loc[v, a], 2) for a in por_ano.columns}}
                          for v in geral.index],
            "escala": [{"classe": classificar_incompletude(p), "limite_inf": p}
                       for p in [0, 5, 10, 20, 50]]}

def resumo_bruto(bruto: pd.DataFrame, tb: pd.DataFrame) -> dict:
    return {"registros_brutos": int(len(bruto)), "variaveis_brutas": int(bruto.shape[1] - 2),
            "duplicatas_removidas": int(bruto.duplicated().sum()), "registros_analiticos": int(len(tb)),
            "casos_novos": int(tb["caso_novo"].sum())}