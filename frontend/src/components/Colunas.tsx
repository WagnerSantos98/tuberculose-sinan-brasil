import { useState } from "react";

interface Props { itens: { rotulo: string; valor: number; detalhe: string }[]; formato: (v: number) => string; rotuloAria: string; rotuloX: string }

/** Colunas verticais finas com valor no topo. */
export function Colunas({ itens, formato, rotuloAria, rotuloX }: Props) {
  const [ativo, setAtivo] = useState<number | null>(null);
  const max = Math.max(...itens.map((i) => i.valor), 1);
  return (
    <div className="grafico">
      <div className="colunas" role="list" aria-label={rotuloAria}>
        {itens.map((it, i) => (
          <div key={it.rotulo} className={`coluna-item ${ativo === i ? "ativa" : ""}`} role="listitem" tabIndex={0}
               onPointerEnter={() => setAtivo(i)} onPointerLeave={() => setAtivo(null)} onFocus={() => setAtivo(i)} onBlur={() => setAtivo(null)}
               aria-label={`${it.rotulo}: ${formato(it.valor)}; ${it.detalhe}`}>
            <span className="coluna-valor">{formato(it.valor)}</span>
            <span className="coluna" style={{ height: `${(it.valor / max) * 180}px` }} />
            <span className="coluna-rotulo">{it.rotulo}</span>
            {ativo === i && <span className="tooltip tooltip-coluna" role="status">{it.detalhe}</span>}
          </div>
        ))}
      </div>
      <p className="rotulo-eixo">{rotuloX}</p>
    </div>
  );
}
