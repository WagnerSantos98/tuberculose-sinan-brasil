const inteiro = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

export const fmtInt = (v: number | null | undefined) => (v == null ? "—" : inteiro.format(Math.round(v)));

export function fmtNum(v: number | null | undefined, casas = 1): string {
  if (v == null || !Number.isFinite(v)) return "—";
  return v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

export const fmtPct = (v: number | null | undefined, casas = 1) => (v == null ? "—" : `${fmtNum(v, casas)}%`);

/** Rótulo de eixo compacto: 80000 -> "80 mil". */
export function fmtEixo(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${fmtNum(v / 1_000_000, v % 1_000_000 ? 1 : 0)} mi`;
  if (Math.abs(v) >= 10_000) return `${fmtNum(v / 1000, 0)} mil`;
  return fmtInt(v);
}

export function fmtData(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" });
}
