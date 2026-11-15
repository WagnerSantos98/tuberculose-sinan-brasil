export interface ItemLegenda { nome: string; cor: string; forma?: "linha" | "barra" | "banda" | "tracejada" }

/** Legenda: a marca repete a forma usada no gráfico (linha para linhas, retângulo para barras). */
export function Legenda({ itens }: { itens: ItemLegenda[] }) {
  return (
    <ul className="legenda" aria-label="Legenda">
      {itens.map((it) => (
        <li key={it.nome}>
          <svg width="22" height="12" aria-hidden="true">
            {it.forma === "barra" && <rect x="3" y="1" width="16" height="10" rx="2" fill={it.cor} />}
            {it.forma === "banda" && <rect x="1" y="1" width="20" height="10" rx="2" fill={it.cor} opacity="0.18" />}
            {it.forma === "tracejada" && <line x1="1" x2="21" y1="6" y2="6" stroke={it.cor} strokeWidth="2" strokeDasharray="4 3" />}
            {(it.forma ?? "linha") === "linha" && <line x1="1" x2="21" y1="6" y2="6" stroke={it.cor} strokeWidth="2" strokeLinecap="round" />}
          </svg>
          <span>{it.nome}</span>
        </li>
      ))}
    </ul>
  );
}
