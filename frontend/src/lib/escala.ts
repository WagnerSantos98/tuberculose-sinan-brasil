/** Escala linear d0..d1 -> r0..r1. */
export function linear(d0: number, d1: number, r0: number, r1: number) {
  const k = d1 === d0 ? 0 : (r1 - r0) / (d1 - d0);
  return (v: number) => r0 + (v - d0) * k;
}

/** Escala logarítmica (base 10). */
export function log(d0: number, d1: number, r0: number, r1: number) {
  const l = linear(Math.log10(d0), Math.log10(d1), r0, r1);
  return (v: number) => l(Math.log10(v));
}

/** Marcas "redondas" entre min e max (algoritmo de passo 1-2-5). */
export function marcas(min: number, max: number, alvo = 5): number[] {
  if (max <= min) return [min];
  const bruto = (max - min) / alvo;
  const p = 10 ** Math.floor(Math.log10(bruto));
  const passo = [1, 2, 2.5, 5, 10].map((m) => m * p).find((s) => s >= bruto) ?? 10 * p;
  const ini = Math.ceil(min / passo) * passo;
  const out: number[] = [];
  for (let v = ini; v <= max + passo * 1e-9; v += passo) out.push(+v.toFixed(10));
  return out;
}

/** Domínio "arredondado" que inclui os valores. */
export function dominio(valores: number[], incluirZero = true): [number, number] {
  const v = valores.filter((x) => Number.isFinite(x));
  let lo = Math.min(...v), hi = Math.max(...v);
  if (incluirZero) lo = Math.min(0, lo);
  if (lo === hi) hi = lo + 1;
  const m = marcas(lo, hi, 5);
  const passo = m.length > 1 ? m[1] - m[0] : 1;
  return [Math.floor(lo / passo) * passo, Math.ceil(hi / passo) * passo];
}
