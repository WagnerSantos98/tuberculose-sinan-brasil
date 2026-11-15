import { useState } from "react";

export interface ItemBarra { id: string; rotulo: string; valor: number | null; detalhe?: string }

interface Props { itens: ItemBarra[]; formato: (v: number | null) => string; max?: number; cor?: string; rotuloAria: string }

/** Barras horizontais finas, valor na ponta, tooltip por barra (hover e foco). */
export function BarList({ itens, formato, max, cor = "var(--serie-1)", rotuloAria }: Props) {
  const [ativo, setAtivo] = useState<string | null>(null);
  const m = max ?? Math.max(...itens.map((i) => i.valor ?? 0), 1);
  return (
    <ul className="barras" aria-label={rotuloAria}>
      {itens.map((it) => (
        <li key={it.id} className={`barra-linha ${ativo === it.id ? "ativa" : ""}`} tabIndex={0}
            onPointerEnter={() => setAtivo(it.id)} onPointerLeave={() => setAtivo(null)}
            onFocus={() => setAtivo(it.id)} onBlur={() => setAtivo(null)}
            aria-label={`${it.rotulo}: ${formato(it.valor)}${it.detalhe ? `; ${it.detalhe}` : ""}`}>
          <span className="barra-rotulo">{it.rotulo}</span>
          <span className="barra-trilho">
            <span className="barra" style={{ width: `${((it.valor ?? 0) / m) * 100}%`, background: cor }} />
            <span className="barra-valor">{formato(it.valor)}</span>
          </span>
          {ativo === it.id && it.detalhe && <span className="tooltip tooltip-barra" role="status">{it.detalhe}</span>}
        </li>
      ))}
    </ul>
  );
}
