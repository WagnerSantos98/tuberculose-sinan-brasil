// Contrato de dados entre analytics (Python) e frontend. Versão: meta.versao_contrato = 1.

export interface UFInfo { sigla: string; nome: string; regiao: string }

export interface Meta {
  versao_contrato: number;
  gerado_em: string;
  fonte: string;
  anos: number[];
  status_por_ano: Record<string, "final" | "preliminar">;
  ultimo_ano_desfecho: number;
  metas: { cura: number; abandono: number };
  regioes: string[];
  ufs: UFInfo[];
  resumo: { registros_brutos: number; variaveis_brutas: number; duplicatas_removidas: number;
            registros_analiticos: number; casos_novos: number };
  definicoes: Record<string, string>;
}

export interface CuboBruto { campos: string[]; linhas: (string | number)[][] }

export interface PontoA1 { ano: number; observado: number; esperado: number; ip_inf: number; ip_sup: number; oe: number }
export interface SerieA1 { inclinacao: number; r2: number; p: number; deficit_2020_2021: number; deficit_pct: number; serie: PontoA1[] }
export type A1 = Record<string, SerieA1>;

export interface LinhaOR { variavel: string; rotulo: string; categoria: string; or: number; li: number | null; ls: number | null }
export interface LinhaBivariada extends LinhaOR { n: number; pct: number; ref: boolean }
export interface LinhaAjustada extends LinhaOR { referencia: string | null; p: number }
export interface A2 {
  coorte: { n: number; pct_desfavoravel: number; anos: [number, number]; composicao: Record<string, number> };
  modelo: { n: number; pseudo_r2: number; idade_media: number; idade_vertice: number };
  bivariada: LinhaBivariada[];
  testes: { variavel: string; rotulo: string; qui2: number; gl: number; p: number }[];
  ajustada: LinhaAjustada[];
  gradiente: { n_vulnerabilidades: number; n: number; pct: number; previsto: number }[];
}

export interface Tempo { desfecho: string; n: number; q1: number; mediana: number; q3: number; min: number; max: number }

export interface Completude {
  variaveis: { variavel: string; rotulo: string; pct_vazio: number; pct_ignorado: number; pct_incompleto: number;
               classificacao: string; por_ano: Record<string, number> }[];
}

export interface Dados { meta: Meta; cubo: CuboBruto; a1: A1; a2: A2; tempo: Tempo[]; completude: Completude }

/** Território selecionado: Brasil, uma região ou uma UF. */
export type Territorio = { tipo: "BR" } | { tipo: "R"; regiao: string } | { tipo: "UF"; uf: string };
/** Ano selecionado: um ano ou o período inteiro. */
export type AnoSel = number | "todos";
