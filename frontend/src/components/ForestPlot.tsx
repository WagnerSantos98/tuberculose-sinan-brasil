import { useState } from "react";
import { log } from "../lib/escala";
import { fmtNum } from "../lib/formato";
import { useLargura } from "../lib/useLargura";

export interface LinhaForest { id: string; rotulo: string; or: number; li: number | null; ls: number | null; detalhe?: string }

/** Forest plot de razões de chances em escala log, com IC 95%. Cor + texto: maior/menor chance/sem diferença. */
export function ForestPlot({ linhas }: { linhas: LinhaForest[] }) {
  const [ref, largura] = useLargura<HTMLDivElement>();
  const [ativo, setAtivo] = useState<string | null>(null);
  const rot = Math.min(340, largura * 0.42), dir = 64;
  const w = largura - rot - dir;
  const lh = 34, h = linhas.length * lh + 34;
  const x = log(0.3, 8, 0, w);
  const ticks = [0.3, 0.5, 1, 2, 4, 8];
  const cor = (l: LinhaForest) => (l.li != null && l.li > 1 ? "var(--status-critico)" : l.ls != null && l.ls < 1 ? "var(--serie-1)" : "var(--mudo)");
  return (
    <div className="grafico" ref={ref}>
      <ul className="legenda">
        <li><span className="ponto" style={{ background: "var(--status-critico)" }} />maior chance (IC acima de 1)</li>
        <li><span className="ponto" style={{ background: "var(--serie-1)" }} />menor chance (IC abaixo de 1)</li>
        <li><span className="ponto" style={{ background: "var(--mudo)" }} />sem diferença (IC inclui 1)</li>
      </ul>
      <div className="grafico-area">
        <svg width={largura} height={h} role="img" aria-label="Razões de chances com intervalo de confiança de 95%">
          <g transform={`translate(${rot},4)`}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={x(t)} x2={x(t)} y1={0} y2={h - 30} className={t === 1 ? "eixo-forte" : "grade"} />
                <text x={x(t)} y={h - 12} textAnchor="middle" className="eixo-texto">{fmtNum(t, t < 1 ? 1 : 0)}</text>
              </g>
            ))}
            {linhas.map((l, i) => {
              const y = i * lh + lh / 2;
              return (
                <g key={l.id} tabIndex={0} className={`forest-linha ${ativo === l.id ? "ativa" : ""}`}
                   onPointerEnter={() => setAtivo(l.id)} onPointerLeave={() => setAtivo(null)}
                   onFocus={() => setAtivo(l.id)} onBlur={() => setAtivo(null)}
                   aria-label={`${l.rotulo}: OR ${fmtNum(l.or, 2)}${l.li != null ? `, IC 95% ${fmtNum(l.li, 2)} a ${fmtNum(l.ls, 2)}` : " (referência)"}`}>
                  <rect x={-rot} y={i * lh} width={largura} height={lh} fill="transparent" />
                  <text x={-12} y={y} dy="0.32em" textAnchor="end" className="forest-rotulo">{l.rotulo}</text>
                  {l.li != null && l.ls != null && (
                    <line x1={x(Math.max(0.3, l.li))} x2={x(Math.min(8, l.ls))} y1={y} y2={y} stroke={cor(l)} strokeWidth={2} strokeLinecap="round" />
                  )}
                  <circle cx={x(l.or)} cy={y} r={5} fill={cor(l)} stroke="var(--superficie)" strokeWidth={2} />
                  <text x={w + 10} y={y} dy="0.32em" className="forest-valor">{fmtNum(l.or, 2)}</text>
                </g>
              );
            })}
          </g>
        </svg>
        {ativo && (() => {
          const i = linhas.findIndex((l) => l.id === ativo);
          const l = linhas[i];
          return (
            <div className="tooltip" role="status" style={{ left: rot + x(l.or), top: i * lh + lh + 6, transform: "translateX(-50%)" }}>
              <p className="tooltip-titulo">{l.rotulo}</p>
              <p className="tooltip-linha"><strong>OR {fmtNum(l.or, 2)}</strong>{l.li != null && <span> IC 95% {fmtNum(l.li, 2)}–{fmtNum(l.ls, 2)}</span>}</p>
              {l.detalhe && <p className="tooltip-linha tooltip-sec">{l.detalhe}</p>}
            </div>
          );
        })()}
      </div>
      <p className="rotulo-eixo">Razão de chances (escala log) — 1 = sem diferença em relação à referência</p>
    </div>
  );
}
