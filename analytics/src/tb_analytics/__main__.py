# Linha de comando do pipeline
import argparse
from . import config

def main() -> None:
    p = argparse.ArgumentParser(prog="tb_analytics", description="Pipeline SINAN Tuberculose -> painel")
    p.add_argument("comando", choices=["baixar", "exportar", "pipeline"])
    p.add_argument("--ano-inicial", type=int, default=config.ANO_INICIAL)
    p.add_argument("--ano-final", type=int, default=config.ANO_FINAL)
    a = p.parse_args()
    if a.comando in ("baixar", "pipeline"):
        from .baixar import baixar
        baixar(a.ano_inicial, a.ano_final)
    if a.comando in ("exportar", "pipeline"):
        from .exportar import exportar
        exportar()

if __name__ == "__main__":
    main()
