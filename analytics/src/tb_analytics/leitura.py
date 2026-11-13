# Leitura dos arquivos .dbc do SINAN
import re
import tempfile
import pandas as pd
from pathlib import Path
from dbfread import DBF
from pyreaddbc import dbc2dbf
from . import config

# Função para ler um .dbc e devoler um DataFrame com todas as colunas
def ler_dbc(caminho, encoding: str = "iso-8859-1") -> pd.DataFrame:
    caminho = Path(caminho)
    with tempfile.TemporaryDirectory() as tmp:
        dbf = str(Path(tmp) / (caminho.stem + ".dbf"))
        dbc2dbf(str(caminho), dbf)
        df = pd.DataFrame(iter(DBF(dbf, encoding=encoding, char_decode_errors="replace")))
    for c in df.columns:
        if pd.api.types.is_float_dtype(df[c]):
            df[c] = df[c].astype("Int64")
        df[c] = df[c].astype("string").str.strip().replace("", pd.NA)
    return df

# Função para ler todos os TUBEBRaa.dbc (usando cache Parquet) e empilha os anos
def carregar_sinan_tb(pasta_dbc=config.DADOS_BRUTOS, pasta_cache=config.DADOS_PROCESSADOS, verbose: bool=True) -> pd.DataFrame:
    pasta_dbc, pasta_cache = Path(pasta_dbc), Path(pasta_cache)
    pasta_cache.mkdir(parents=True, exist_ok=True)
    partes = []
    for arq in sorted(pasta_dbc.glob("TUBEBR*.dbc")):
        ano = 2000 + int(re.search(r"TUBEBR(\d{2})", arq.name).group(1))
        cache = pasta_cache / f"{arq.stem}.parquet"
        if cache.exists() and cache.stat().st_mtime >= arq.stat().st_mtime:
            parte = pd.read_parquet(cache)
        else:
            if verbose:
                print(f"[leitura] convertendo {arq.name} ...")
            parte = ler_dbc(arq)
            parte.to_parquet(cache, index=False)
        parte["ARQUIVO_ANO"] = ano
        parte["STATUS_BASE"] = "final" if ano <= config.ULTIMO_ANO_FINAL else "preliminar"
        partes.append(parte)
    if not partes:
        raise FileNotFoundError(f"Nenhum TUBEBR*.dbc em {pasta_dbc.resolve()}. Rode `python -m tb_analytics baixar`.")
    return pd.concat(partes, ignore_index=True)