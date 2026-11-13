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


    

