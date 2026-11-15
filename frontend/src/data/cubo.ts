import type { AnoSel, CuboBruto, Meta, Territorio } from "./types";

/** Uma linha agregada: nome do campo -> contagem. */
export type Linha = Record<string, number>;

export const FAIXAS = ["0–14", "15–24", "25–34", "35–44", "45–54", "55–64", "65+"];

export const AGRAVOS: { id: string; rotulo: string }[] = [
  { id: "tabagismo", rotulo: "Tabagismo" }, { id: "alcool", rotulo: "Alcoolismo" },
  { id: "drogas", rotulo: "Drogas ilícitas" }, { id: "aids", rotulo: "Aids" },
  { id: "pop_liberdade", rotulo: "Privado de liberdade" }, { id: "diabetes", rotulo: "Diabetes" },
  { id: "benef_gov", rotulo: "Benef. de transferência de renda" }, { id: "pop_rua", rotulo: "Em situação de rua" },
  { id: "doenca_mental", rotulo: "Doença mental" }, { id: "prof_saude", rotulo: "Profissional de saúde" },
  { id: "imigrante", rotulo: "Imigrante" },
];

export const RACAS: { id: string; rotulo: string }[] = [
  { id: "raca_parda", rotulo: "Parda" }, { id: "raca_branca", rotulo: "Branca" }, { id: "raca_preta", rotulo: "Preta" },
  { id: "raca_indigena", rotulo: "Indígena" }, { id: "raca_amarela", rotulo: "Amarela" },
  { id: "raca_ign", rotulo: "Ignorada / em branco" },
];

/** Converte o cubo compacto em objetos e indexa por ano. */
export class Cubo {
  readonly campos: string[];
  private linhas: { uf: string; ano: number; v: Linha }[];

  constructor(bruto: CuboBruto, private meta: Meta) {
    this.campos = bruto.campos.slice(2);
    this.linhas = bruto.linhas.map((l) => {
      const v: Linha = {};
      this.campos.forEach((c, i) => { v[c] = l[i + 2] as number; });
      return { uf: l[0] as string, ano: l[1] as number, v };
    });
  }

  private pertence(uf: string, t: Territorio): boolean {
    if (t.tipo === "BR") return true;
    if (t.tipo === "UF") return uf === t.uf;
    return this.meta.ufs.find((u) => u.sigla === uf)?.regiao === t.regiao;
  }

  /** Soma os campos para um território e um ano (ou todos os anos). */
  soma(t: Territorio, ano: AnoSel, ufFixa?: string): Linha {
    const out: Linha = Object.fromEntries(this.campos.map((c) => [c, 0]));
    for (const l of this.linhas) {
      if (ano !== "todos" && l.ano !== ano) continue;
      if (ufFixa ? l.uf !== ufFixa : !this.pertence(l.uf, t)) continue;
      for (const c of this.campos) out[c] += l.v[c];
    }
    return out;
  }

  /** Série anual de linhas somadas para um território. */
  serie(t: Territorio): { ano: number; v: Linha }[] {
    return this.meta.anos.map((ano) => ({ ano, v: this.soma(t, ano) }));
  }
}

const div = (a: number, b: number) => (b > 0 ? (a / b) * 100 : null);

/** Indicadores derivados de uma linha agregada (percentuais 0–100 ou null). */
export function indicadores(v: Linha) {
  const hivTestados = v.hiv_pos + v.hiv_neg + v.hiv_andamento;
  return {
    casosNovos: v.casos_novos,
    notificacoes: v.notificacoes,
    cura: div(v.enc_cura, v.novos_pulmonares),
    abandono: div(v.enc_abandono, v.novos_pulmonares),
    obitoTB: div(v.enc_obito_tb, v.novos_pulmonares),
    semEncerramento: div(v.enc_sem_info, v.novos_pulmonares),
    testagemHIV: div(hivTestados, v.casos_novos),
    coinfeccaoHIV: div(v.hiv_pos, v.casos_novos),
    trm: div(v.trm_realizado, v.trm_valido),
    reingresso: div(v.tipo_reingresso, v.notificacoes),
    recidiva: div(v.tipo_recidiva, v.notificacoes),
    transferencia: div(v.tipo_transferencia, v.notificacoes),
  };
}

export function nomeTerritorio(t: Territorio, meta: Meta): string {
  if (t.tipo === "BR") return "Brasil";
  if (t.tipo === "R") return `Região ${t.regiao}`;
  return meta.ufs.find((u) => u.sigla === t.uf)?.nome ?? t.uf;
}

export function chaveA1(t: Territorio): string {
  return t.tipo === "BR" ? "BR" : t.tipo === "R" ? `R:${t.regiao}` : `UF:${t.uf}`;
}
