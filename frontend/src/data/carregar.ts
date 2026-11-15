import type { A1, A2, Completude, CuboBruto, Dados, Meta, Tempo } from "./types";

const BASE = `${import.meta.env.BASE_URL}data/`;

async function json<T>(nome: string): Promise<T> {
  const r = await fetch(BASE + nome, { cache: "no-cache" });
  if (!r.ok) throw new Error(`Não foi possível carregar ${nome} (HTTP ${r.status}).`);
  return r.json() as Promise<T>;
}

export async function carregarDados(): Promise<Dados> {
  const [meta, cubo, a1, a2, tempo, completude] = await Promise.all([
    json<Meta>("meta.json"), json<CuboBruto>("cubo_uf_ano.json"), json<A1>("a1_tendencia.json"),
    json<A2>("a2_fatores.json"), json<Tempo[]>("tempo_tratamento.json"), json<Completude>("completude.json"),
  ]);
  if (meta.versao_contrato !== 1) {
    throw new Error(`Versão do contrato de dados (${meta.versao_contrato}) incompatível com o painel (1).`);
  }
  return { meta, cubo, a1, a2, tempo, completude };
}
