import { useState } from "react";
import { passoRampa, RAMPA, textoNaRampa } from "../lib/cores";

/** Posição (coluna, linha) de cada UF numa grade que lembra o mapa do Brasil. */
const GRADE: Record<string, [number, number]> = {
  RR: [1, 0], AP: [3, 0],
  AM: [1, 1], PA: [2, 1], MA: [3, 1], CE: [4, 1], RN: [5, 1],
  AC: [0, 2], RO: [1, 2], TO: [2, 2], PI: [3, 2], PE: [4, 2], PB: [5, 2],
  MT: [1, 3], GO: [2, 3], DF: [3, 3], BA: [4, 3], AL: [5, 3],
  MS: [1, 4], SP: [2, 4], MG: [3, 4], ES: [4, 4], SE: [5, 4],
  PR: [2, 5], RJ: [3, 5],
  SC: [2, 6],
  RS: [2, 7],
};

interface Props {
  valores: Record<string, number | null>;
  nomes: Record<string, string>;
  formato: (v: number | null) => string;
  destacadas: string[];
  aoClicar?: (uf: string) => void;
  rotuloAria: string;
}

/** Mapa em grade (tile map): cada UF é um quadrado do mesmo tamanho, colorido por uma rampa sequencial. */
export function MapaGrade({ valores, nomes, formato, destacadas, aoClicar, rotuloAria }: Props) {
  const [ativo, setAtivo] = useState<string | null>(null);
  const vals = Object.values(valores).filter((v): v is number => v != null);
  const min = Math.min(...vals), max = Math.max(...vals);
  const t = 62, g = 4;
  return (
    <div className="mapa-wrap">
      <div className="mapa" role="list" aria-label={rotuloAria} style={{ width: 6 * (t + g), height: 8 * (t + g) }}>
        {Object.entries(GRADE).map(([uf, [c, l]]) => {
          const v = valores[uf] ?? null;
          const passo = v == null ? -1 : passoRampa(v, min, max);
          return (
            <button key={uf} type="button" role="listitem"
                    className={`tile ${destacadas.includes(uf) ? "destacada" : ""} ${ativo === uf ? "ativa" : ""}`}
                    style={{ left: c * (t + g), top: l * (t + g), width: t, height: t,
                             background: passo < 0 ? "var(--grade)" : RAMPA[passo],
                             color: passo < 0 ? "var(--tinta-2)" : textoNaRampa(passo) }}
                    onPointerEnter={() => setAtivo(uf)} onPointerLeave={() => setAtivo(null)}
                    onFocus={() => setAtivo(uf)} onBlur={() => setAtivo(null)}
                    onClick={() => aoClicar?.(uf)}
                    aria-label={`${nomes[uf]}: ${formato(v)}`}>
              <span className="tile-uf">{uf}</span>
              <span className="tile-valor">{formato(v)}</span>
            </button>
          );
        })}
        {ativo && (
          <span className="tooltip" role="status"
                style={{ left: (GRADE[ativo][0] + 1) * (t + g) + 4, top: GRADE[ativo][1] * (t + g) }}>
            <strong>{formato(valores[ativo] ?? null)}</strong> {nomes[ativo]}
          </span>
        )}
      </div>
      <div className="escala" aria-hidden="true">
        <span>{formato(min)}</span>
        <span className="escala-rampa">{RAMPA.map((c) => <span key={c} style={{ background: c }} />)}</span>
        <span>{formato(max)}</span>
      </div>
    </div>
  );
}
