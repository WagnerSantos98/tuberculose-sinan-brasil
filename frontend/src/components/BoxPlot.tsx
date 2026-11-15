import { useState } from "react";
import { linear, marcas } from "../lib/escala";
import { fmtInt } from "../lib/formato";
import { useLargura } from "../lib/useLargura";
import type { Tempo } from "../data/types";

/** Boxplot horizontal a partir de estatísticas resumo (Q1, mediana, Q3, bigodes de 1,5 IIQ). */
export function BoxPlot({ dados, referencia }: { dados: Tempo[]; referencia?: { valor: number; rotulo: string } }) {
  const [ref, largura] = useLargura<HTMLDivElement>();
  const [ativo, setAtivo] = useState<number | null>(null);
  const rot = 190, lh = 40;
  const w = largura - rot - 24, h = dados.length * lh + 30;
  const max = Math.max(...dados.map((d) => d.max), referencia?.valor ?? 0);
  const x = linear(0, max, 0, w);
  return (
    <div className="grafico" ref={ref}>
      <div className="grafico-area">
        <svg width={largura} height={h} role="img" aria-label="Boxplot do tempo de tratamento por desfecho">
          <g transform={`translate(${rot},4)`}>
            {marcas(0, max, 6).map((t) => (
              <g key={t}>
                <line x1={x(t)} x2={x(t)} y1={0} y2={h - 30} className="grade" />
                <text x={x(t)} y={h - 12} textAnchor="middle" className="eixo-texto">{t}</text>
              </g>
            ))}
            {referencia && (
              <g>
                <line x1={x(referencia.valor)} x2={x(referencia.valor)} y1={0} y2={h - 30} className="referencia" />
              </g>
            )}
            {dados.map((d, i) => {
              const y = i * lh + lh / 2;
              return (
                <g key={d.desfecho} tabIndex={0} onPointerEnter={() => setAtivo(i)} onPointerLeave={() => setAtivo(null)}
                   onFocus={() => setAtivo(i)} onBlur={() => setAtivo(null)}
                   aria-label={`${d.desfecho}: mediana ${d.mediana} dias, intervalo interquartil ${d.q1} a ${d.q3}`}>
                  <rect x={-rot} y={i * lh} width={largura} height={lh} fill="transparent" />
                  <text x={-12} y={y} dy="0.32em" textAnchor="end" className="forest-rotulo">{d.desfecho}</text>
                  <line x1={x(d.min)} x2={x(d.max)} y1={y} y2={y} stroke="var(--serie-1)" strokeWidth={1.5} />
                  <rect x={x(d.q1)} y={y - 10} width={Math.max(2, x(d.q3) - x(d.q1))} height={20} rx={3}
                        fill="var(--serie-1-lavado)" stroke="var(--serie-1)" strokeWidth={1.5} />
                  <line x1={x(d.mediana)} x2={x(d.mediana)} y1={y - 10} y2={y + 10} stroke="var(--tinta)" strokeWidth={2.5} />
                </g>
              );
            })}
          </g>
        </svg>
        {ativo != null && (
          <div className="tooltip" role="status" style={{ left: rot + x(dados[ativo].q3) + 8, top: ativo * lh }}>
            <p className="tooltip-titulo">{dados[ativo].desfecho}</p>
            <p className="tooltip-linha"><strong>{dados[ativo].mediana} dias</strong> <span>mediana</span></p>
            <p className="tooltip-linha tooltip-sec">IIQ {dados[ativo].q1}–{dados[ativo].q3} · n = {fmtInt(dados[ativo].n)}</p>
          </div>
        )}
      </div>
      <p className="rotulo-eixo">Dias entre início do tratamento e encerramento{referencia ? ` — linha vertical: ${referencia.rotulo}` : ""}</p>
    </div>
  );
}
