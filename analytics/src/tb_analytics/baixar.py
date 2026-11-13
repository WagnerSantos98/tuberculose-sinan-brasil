# Download dos microdados do SINAN Tuberculose (TUBEBRaa.dbc)
from ftplib import FTP, error_perm
from pathlib import Path

from . import config

SERVIDOR = "ftp.datasus.gov.br"
PASTAS = {"final": "/dissemin/publicos/SINAN/DADOS/FINAIS",
          "preliminar": "/dissemin/publicos/SINAN/DADOS/PRELIM"}

# Função para baixar TUBEBRaa.dbc na pasta `destino`; validar arquivos já existentes para serem mantidos.
def baixar(ano_ini: int = config.ANO_INICIAL, ano_fim: int = config.ANO_FINAL, destino: Path = config.DADOS_BRUTOS) -> list[Path]:
    destino = Path(destino)
    destino.mkdir(parents=True, exist_ok=True)
    faltando = [a for a in range(ano_ini, ano_fim + 1) if not (destino / f"TUBER{str(a)[-2:]}.dbc").exists()]
    if not faltando:
        print(f"[baixar] todos os arquivos {ano_ini}-{ano_fim} já estão em {destino}")
        return sorted(destino.glob("TUBEBR*.dbc"))
    with FTP(SERVIDOR, timeout=180) as ftp:
        ftp.login()
        for ano in faltando:
            nome = f"TUBEBR{str(ano)[-2:]}.dbc"
            alvo = destino / nome
            for status, pasta in PASTAS.items():
                try:
                    ftp.cwd(pasta)
                    with open(alvo, "wb") as f:
                        ftp.retrbinary(f"RETR {nome}", f.write)
                    print(f"[baixar] {nome}: ok ({status}, {alvo.stat().st_size / 1e6:.1f} MB)")
                    break
                except error_perm:
                    alvo.unlink(missing_ok=True)
            else:
                print(f"[baixar] {nome}: não encontrado no FTP")
    return sorted(destino.glob("TUBEBR*.dbc"))