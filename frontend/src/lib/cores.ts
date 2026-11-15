/** Cores lidas das variáveis CSS (mudam com o tema claro/escuro). */
export const SERIE = ["var(--serie-1)", "var(--serie-2)", "var(--serie-3)"];

/** Rampa sequencial de 7 passos (azul), do valor baixo ao alto; definida em CSS por tema. */
export const RAMPA = Array.from({ length: 7 }, (_, i) => `var(--seq-${i + 1})`);

export function passoRampa(v: number, min: number, max: number, passos = 7): number {
  if (!Number.isFinite(v)) return -1;
  const t = max === min ? 0.5 : (v - min) / (max - min);
  return Math.min(passos - 1, Math.max(0, Math.floor(t * passos)));
}

/** Passos 1–4 (claros) levam texto escuro; 5–7, texto claro. Os temas definem rampas com essa propriedade. */
export const textoNaRampa = (passo: number) => (passo >= 4 ? "var(--texto-sobre-escuro)" : "var(--texto-sobre-claro)");
