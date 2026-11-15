import { useState, type KeyboardEvent, type PointerEvent } from "react";
import { dominio, linear, marcas } from "../lib/escala";
import { useLargura } from "../lib/useLargura";
import { Legenda, type ItemLegenda } from "./Legenda";

export interface SerieLinha { id: string; nome: string; cor: string; valores: (number | null)[]; tracejada?: boolean }

interface Props {
  x: number[];
  series: SerieLinha[];
  banda?: { nome: string; cor: string; inf: (number | null)[]; sup: (number | null)[] };
  referencias?: { valor: number; rotulo: string }[];
  sombreado?: { de: number; ate: number; rotulo: string };
  marcaX?: number;
  formatoY: (v: number) => string;
  formatoValor: (v: number | null) => string;
  yDominio?: [number, number];
  incluirZero?: boolean;
  altura?: number;
  rotuloEixo?: string;
}

const M = { t: 14, r: 20, b: 30, l: 56 };

/** Gráfico de linhas com cruzeta (crosshair) e tooltip que lista todas as séries no ano apontado. */
export function LineChart(p: Props) {
  const [ref, largura] = useLargura<HTMLDivElement>();
  const [idx, setIdx] = useState<number | null>(null);
  const altura = p.altura ?? 260;
  const mr = p.referencias?.length ? 72 : M.r;          // espaço à direita para os rótulos das metas
  const w = largura - M.l - mr;
  const h = altura - M.t - M.b;

  const todos = [
    ...p.series.flatMap((s) => s.valores),
    ...(p.banda ? [...p.banda.inf, ...p.banda.sup] : []),
    ...(p.referencias?.map((r) => r.valor) ?? []),
  ].filter((v): v is number => v != null);
  const [y0, y1] = p.yDominio ?? dominio(todos, p.incluirZero ?? true);
  const sx = linear(p.x[0], p.x[p.x.length - 1], 0, w);
  const sy = linear(y0, y1, h, 0);
  const ticksY = marcas(y0, y1, 5);
  const passoX = w / Math.max(1, p.x.length - 1);
  const mostrarCadaX = passoX < 44 ? 2 : 1;

  const caminho = (vals: (number | null)[]) => {
    let d = "", aberto = false;
    vals.forEach((v, i) => {
      if (v == null) { aberto = false; return; }
      d += `${aberto ? "L" : "M"}${sx(p.x[i]).toFixed(1)},${sy(v).toFixed(1)}`;
      aberto = true;
    });
    return d;
  };
  const caminhoBanda = () => {
    if (!p.banda) return "";
    const pts = p.x.map((x, i) => [x, p.banda!.inf[i], p.banda!.sup[i]] as const).filter(([, a, b]) => a != null && b != null);
    const sup = pts.map(([x, , b]) => `${sx(x)},${sy(b as number)}`).join("L");
    const inf = pts.slice().reverse().map(([x, a]) => `${sx(x)},${sy(a as number)}`).join("L");
    return `M${sup}L${inf}Z`;
  };

  const mover = (e: PointerEvent<SVGRectElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.round((e.clientX - r.left) / passoX);
    setIdx(Math.max(0, Math.min(p.x.length - 1, i)));
  };
  const teclado = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") setIdx((i) => Math.min(p.x.length - 1, (i ?? -1) + 1));
    else if (e.key === "ArrowLeft") setIdx((i) => Math.max(0, (i ?? p.x.length) - 1));
    else return;
    e.preventDefault();
  };

  const itensLegenda: ItemLegenda[] = [
    ...p.series.map((s) => ({ nome: s.nome, cor: s.cor, forma: s.tracejada ? "tracejada" as const : "linha" as const })),
    ...(p.banda ? [{ nome: p.banda.nome, cor: p.banda.cor, forma: "banda" as const }] : []),
  ];
  const mostrarLegenda = itensLegenda.length >= 2;

  const tipX = idx != null ? M.l + sx(p.x[idx]) : 0;
  const tipAEsquerda = tipX > largura * 0.62;

  return (
    <div className="grafico" ref={ref}>
      {mostrarLegenda && <Legenda itens={itensLegenda} />}
      <div className="grafico-area">
        <svg width={largura} height={altura} role="img"
             aria-label={`Gráfico de linhas: ${p.series.map((s) => s.nome).join(", ")}, ${p.x[0]}–${p.x[p.x.length - 1]}`}>
          <g transform={`translate(${M.l},${M.t})`}>
            {p.sombreado && (
              <g>
                <rect x={sx(p.sombreado.de) - passoX / 2} y={0} width={w - sx(p.sombreado.de) + passoX / 2}
                      height={h} className="sombreado" />
                <text x={w - 4} y={12} textAnchor="end" className="rotulo-sombreado">{p.sombreado.rotulo}</text>
              </g>
            )}
            {ticksY.map((t) => (
              <g key={t}>
                <line x1={0} x2={w} y1={sy(t)} y2={sy(t)} className="grade" />
                <text x={-8} y={sy(t)} dy="0.32em" textAnchor="end" className="eixo-texto">{p.formatoY(t)}</text>
              </g>
            ))}
            <line x1={0} x2={w} y1={h} y2={h} className="eixo" />
            {p.x.map((x, i) => (i % mostrarCadaX === 0 || i === p.x.length - 1) && (
              <text key={x} x={sx(x)} y={h + 20} textAnchor="middle" className="eixo-texto">{x}</text>
            ))}
            {p.referencias?.map((r) => (
              <g key={r.rotulo}>
                <line x1={0} x2={w} y1={sy(r.valor)} y2={sy(r.valor)} className="referencia" />
                <text x={w + 6} y={sy(r.valor)} dy="0.32em" className="rotulo-referencia">{r.rotulo}</text>
              </g>
            ))}
            {p.banda && <path d={caminhoBanda()} fill={p.banda.cor} opacity={0.14} />}
            {p.series.map((s) => (
              <path key={s.id} d={caminho(s.valores)} fill="none" stroke={s.cor} strokeWidth={2}
                    strokeLinejoin="round" strokeLinecap="round" strokeDasharray={s.tracejada ? "5 4" : undefined} />
            ))}
            {p.series.filter((s) => !s.tracejada).map((s) => s.valores.map((v, i) => v != null && (
              <circle key={`${s.id}-${i}`} cx={sx(p.x[i])} cy={sy(v)} r={p.x[i] === p.marcaX || idx === i ? 5 : 3}
                      fill={s.cor} stroke="var(--superficie)" strokeWidth={2} />
            )))}
            {idx != null && <line x1={sx(p.x[idx])} x2={sx(p.x[idx])} y1={0} y2={h} className="cruzeta" />}
            <rect x={-passoX / 2} y={0} width={w + passoX} height={h} fill="transparent" tabIndex={0}
                  aria-label="Use as setas para navegar pelos anos" className="alvo"
                  onPointerMove={mover} onPointerLeave={() => setIdx(null)} onFocus={() => setIdx((i) => i ?? p.x.length - 1)}
                  onBlur={() => setIdx(null)} onKeyDown={teclado} />
          </g>
        </svg>
        {idx != null && (
          <div className="tooltip" role="status" style={{ left: tipX, transform: `translateX(${tipAEsquerda ? "calc(-100% - 12px)" : "12px"})` }}>
            <p className="tooltip-titulo">{p.x[idx]}</p>
            {p.series.map((s) => (
              <p key={s.id} className="tooltip-linha">
                <svg width="14" height="8" aria-hidden="true"><line x1="0" x2="14" y1="4" y2="4" stroke={s.cor} strokeWidth="2" strokeDasharray={s.tracejada ? "4 3" : undefined} /></svg>
                <strong>{p.formatoValor(s.valores[idx])}</strong> <span>{s.nome}</span>
              </p>
            ))}
            {p.banda && p.banda.inf[idx] != null && (
              <p className="tooltip-linha tooltip-sec">IP 95%: {p.formatoValor(p.banda.inf[idx])} – {p.formatoValor(p.banda.sup[idx])}</p>
            )}
          </div>
        )}
      </div>
      {p.rotuloEixo && <p className="rotulo-eixo">{p.rotuloEixo}</p>}
    </div>
  );
}
