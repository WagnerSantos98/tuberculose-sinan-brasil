import type { ReactNode } from "react";

export type Estado = "bom" | "atencao" | "critico" | "neutro";

const ICONE: Record<Estado, string> = { bom: "✓", atencao: "!", critico: "✕", neutro: "" };

interface Props { rotulo: string; valor: string; detalhe?: ReactNode; estado?: Estado; textoEstado?: string; aviso?: string }

/** Cartão de número: valor grande + rótulo; o estado (meta) vem sempre com ícone e texto, nunca só com cor. */
export function StatTile({ rotulo, valor, detalhe, estado = "neutro", textoEstado, aviso }: Props) {
  return (
    <div className="stat">
      <p className="stat-rotulo">{rotulo}</p>
      <p className="stat-valor">{valor}</p>
      {estado !== "neutro" && textoEstado && (
        <p className={`stat-estado estado-${estado}`}><span className="estado-icone" aria-hidden="true">{ICONE[estado]}</span>{textoEstado}</p>
      )}
      {detalhe && <p className="stat-detalhe">{detalhe}</p>}
      {aviso && <p className="stat-aviso"><span className="estado-icone estado-atencao-icone" aria-hidden="true">!</span>{aviso}</p>}
    </div>
  );
}
