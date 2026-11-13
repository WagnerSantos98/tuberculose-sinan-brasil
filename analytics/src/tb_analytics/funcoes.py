# Funções próprias do projeto
import numpy as np
import pandas as pd
from scipy import stats

# Função para % de campos incompletos
def classificar_incompletude(p: float) -> str:
    return("Excelente" if p < 5 else "Bom" if p < 10 else "Regular" if p < 20 else "Ruim" if p < 50 else "Muito ruim")

# Função para percentual de campos vazios + ignorados e classificação
def avaliar_incompletude(dados: pd.DataFrame, colunas, codigos_ignorado=("Ignorado", "9"), por=None):
    def resumo(df):
        linhas = []
        for c in colunas:
            s = df[c]
            vazio = s.isna().mean() * 100
            ign = s.astype("string").isin([str(x) for x in codigos_ignorado]).mean() * 100
            linhas.append({"variável": c, "n": len(s), "% vazio": vazio, "% ignorado": ign, "% incompleto": vazio + ign, "classificação": classificar_incompletude(vazio + ign)})
        return pd.DataFrame(linhas).set_index("variável")
    
    if por is None:
        return resumo(dados).sort_values("% incompleto", ascending=False)
    return pd.concat({g: resumo(d)["% incompleto"] for g, d in dados.groupby(por, observed=True)}, axis=1)

# Função para tabela bivariada: n, % desfecho, OR bruta (IC 95%, Woolf) vs. referência e teste qui-quadrado
def comparar_desfecho(dados: pd.DataFrame, grupo: str, desfecho: str = "desfecho_desfav", referencia=None, excluir=("Ignorado",)) -> pd.DataFrame:
    d = dados[[grupo, desfecho]].dropna()
    d = d[~d[grupo].astype("string").isin(excluir)]
    tab = pd.crosstab([grupo], d[desfecho]).reindex(columns=[0, 1], fill_value=0)
    tab = tab[tab.sum(axis=1) > 0]
    if referencia is None:
        referencia = tab.sum(axis=1).idxmax()
    c_ref, a_ref = tab.loc[referencia, 0], tab.loc[referencia, 1]
    linhas = []
    for cat, (sem, com) in tab.iterrows():
        n = sem + com
        if cat == referencia:
            orr, li, ls = 1.0, np.nan, np.nan
        else:
            a, b, c, d = com, sem, a_ref, c_ref
            if min(a, b, c, d) == 0:
                a, b, c, d = a + .5, b + .5, c + .5, d + .5
            orr = (a * d) / (b * c)
            ep = np.sqrt(1 / a + 1 / b + 1 / c + 1 / d)
            li, ls = np.exp(np.log(orr) - 1.96 * ep), np.exp(np.log(orr) + 1.96 * ep)
        linhas.append({"variável": grupo, "categoria": cat, "n": n, "% desfecho": com / n * 100, "OR bruta": orr, "IC95% inf": li, "IC95% sup": ls, "ref": "ref." if cat == referencia else ""})
    res = pd.DataFrame(linhas).set_index(["variável", "categoria"])
    chi2, p, gl, _ = stats.chi2_contingency(tab.values)
    res.attrs = {"qui2": float(chi2), "gl": int(gl), "p": float(p)}
    return res