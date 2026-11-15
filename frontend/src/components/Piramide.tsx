import { useState } from "react";
import { fmtInt, fmtPct } from "../lib/formato";
import { Legenda } from "./Legenda";

interface Props { faixas: string[]; masculino: number[]; feminino: number[] }

/** Pirâmide etária: homens à esquerda, mulheres à direita, em % do total de casos novos com sexo e idade válidos. */
export function Piramide({ faixas, masculino, feminino }: Props) {
  const [ativo, setAtivo] = useState<number | null>(null);
  const total = masculino.reduce((a, b) => a + b, 0) + feminino.reduce((a, b) => a + b, 0);
  const pct = (v: number) => (total ? (v / total) * 100 : 0);
  const max = Math.max(...masculino.map(pct), ...feminino.map(pct), 1);
  const ordem = faixas.map((_, i) => i).reverse();   // 65+ no topo
  return (
    <div className="grafico">
      <Legenda itens={[{ nome: "Masculino", cor: "var(--serie-1)", forma: "barra" }, { nome: "Feminino", cor: "var(--serie-2)", forma: "barra" }]} />
      <div className="piramide" role="list" aria-label="Pirâmide etária dos casos novos">
        {ordem.map((i) => (
          <div key={faixas[i]} className={`piramide-linha ${ativo === i ? "ativa" : ""}`} role="listitem" tabIndex={0}
               onPointerEnter={() => setAtivo(i)} onPointerLeave={() => setAtivo(null)} onFocus={() => setAtivo(i)} onBlur={() => setAtivo(null)}
               aria-label={`${faixas[i]} anos: masculino ${fmtPct(pct(masculino[i]))}, feminino ${fmtPct(pct(feminino[i]))}`}>
            <span className="piramide-lado esq">
              <span className="barra-valor">{fmtPct(pct(masculino[i]))}</span>
              <span className="barra" style={{ width: `${(pct(masculino[i]) / max) * 100}%`, background: "var(--serie-1)" }} />
            </span>
            <span className="piramide-faixa">{faixas[i]}</span>
            <span className="piramide-lado dir">
              <span className="barra" style={{ width: `${(pct(feminino[i]) / max) * 100}%`, background: "var(--serie-2)" }} />
              <span className="barra-valor">{fmtPct(pct(feminino[i]))}</span>
            </span>
            {ativo === i && (
              <span className="tooltip tooltip-barra" role="status">
                {faixas[i]} anos — masculino: {fmtInt(masculino[i])} · feminino: {fmtInt(feminino[i])}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
