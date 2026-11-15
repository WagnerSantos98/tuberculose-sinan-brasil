import { useState } from "react";
import { BoxPlot } from "../components/BoxPlot";
import { ChartCard } from "../components/ChartCard";
import { Colunas } from "../components/Colunas";
import { ForestPlot, type LinhaForest } from "../components/ForestPlot";
import { LineChart } from "../components/LineChart";
import type { Dados } from "../data/types";
import { SERIE } from "../lib/cores";
import { fmtEixo, fmtInt, fmtNum, fmtPct } from "../lib/formato";

/** Rótulo curto; a categoria de referência vai para o tooltip e para a nota do cartão. */
const nomeLinha = (rotulo: string, cat: string, ref: string | null) =>
  ref === "Não" ? rotulo : `${rotulo}: ${cat.toLowerCase()}`;
const refTexto = (ref: string | null) => (ref && ref !== "Não" ? `referência: ${ref.toLowerCase()}` : "referência: não");

export function Analises({ dados }: { dados: Dados }) {
  const { a1, a2, meta, tempo } = dados;
  const [modo, setModo] = useState<"ajustada" | "bruta">("ajustada");
  const br = a1.BR;
  const anos = meta.anos;

  const linhasAjust: LinhaForest[] = a2.ajustada.filter((l) => l.variavel !== "idade_z2").map((l) => ({
    id: `${l.variavel}-${l.categoria}`,
    rotulo: l.variavel === "idade_z" ? "Idade (por +1 DP ≈ 17 anos)" : nomeLinha(l.rotulo, l.categoria, l.referencia),
    or: l.or, li: l.li, ls: l.ls,
    detalhe: `${l.variavel === "idade_z" ? "idade em escore Z" : refTexto(l.referencia)} · p ${l.p < 0.001 ? "< 0,001" : "= " + fmtNum(l.p, 3)}`,
  })).sort((a, b) => b.or - a.or);
  const refs = Object.fromEntries(a2.bivariada.filter((b) => b.ref).map((b) => [b.variavel, b.categoria]));
  const linhasBiv: LinhaForest[] = a2.bivariada.filter((b) => !b.ref).map((b) => ({
    id: `${b.variavel}-${b.categoria}`, rotulo: nomeLinha(b.rotulo, b.categoria, refs[b.variavel] ?? null),
    or: b.or, li: b.li, ls: b.ls,
    detalhe: `${refTexto(refs[b.variavel] ?? null)} · ${fmtPct(b.pct)} com desfecho desfavorável (n = ${fmtInt(b.n)})`,
  })).sort((a, b) => b.or - a.or);
  const linhas = modo === "ajustada" ? linhasAjust : linhasBiv;

  return (
    <div className="painel">
      <p className="contexto">Análises do projeto — <strong>Brasil</strong>. Estes resultados não mudam com os filtros do painel.</p>

      <h2 className="secao">A1 · A pandemia de COVID‑19 reduziu as notificações?</h2>
      <div className="grade-2">
        <ChartCard titulo="Casos novos: observado vs. tendência pré‑pandemia"
                   subtitulo={`Regressão linear 2015–2019: +${fmtInt(br.inclinacao)} casos/ano (R² = ${fmtNum(br.r2, 2)}). Faixa = intervalo de predição de 95%.`}
                   tabela={{ colunas: ["Ano", "Observado", "Esperado", "O/E"], linhas: br.serie.map((p) => [p.ano, fmtInt(p.observado), fmtInt(p.esperado), fmtNum(p.oe, 2)]) }}>
          <LineChart x={anos} incluirZero={false} altura={280}
                     series={[{ id: "obs", nome: "Observado", cor: SERIE[0], valores: br.serie.map((p) => p.observado) },
                              { id: "esp", nome: "Esperado", cor: "var(--mudo)", tracejada: true, valores: br.serie.map((p) => p.esperado) }]}
                     banda={{ nome: "IP 95%", cor: "var(--mudo)", inf: br.serie.map((p) => p.ip_inf), sup: br.serie.map((p) => p.ip_sup) }}
                     formatoY={fmtEixo} formatoValor={(v) => fmtInt(v)} />
        </ChartCard>
        <div className="card texto">
          <h3 className="card-titulo">O que os dados mostram</h3>
          <p className="destaque-num">{fmtInt(Math.abs(br.deficit_2020_2021))}</p>
          <p>casos novos a menos que o esperado em 2020–2021 ({fmtNum(br.deficit_pct)}%). Nesses dois anos o observado ficou abaixo do limite inferior do intervalo de predição.</p>
          <table className="tabela compacta">
            <caption>Razão observado/esperado por região</caption>
            <thead><tr><th scope="col">Região</th>{[2020, 2021, 2022, 2025].map((a) => <th key={a} scope="col">{a}</th>)}</tr></thead>
            <tbody>
              {meta.regioes.map((r) => (
                <tr key={r}><th scope="row">{r}</th>
                  {[2020, 2021, 2022, 2025].map((a) => <td key={a}>{fmtNum(a1[`R:${r}`].serie.find((p) => p.ano === a)?.oe, 2)}</td>)}</tr>
              ))}
            </tbody>
          </table>
          <p className="cautela"><strong>Cautela:</strong> a queda é consistente com subdiagnóstico, mas parte pode ser real (máscaras e distanciamento). A reta usa só 5 pontos; sem população no denominador, não são taxas.</p>
        </div>
      </div>

      <h2 className="secao">A2 · Quem tem mais chance de abandono ou óbito por TB?</h2>
      <div className="grade-2 grade-2-larga">
        <ChartCard titulo="Fatores associados ao desfecho desfavorável"
                   subtitulo={`Casos novos pulmonares ${a2.coorte.anos[0]}–${a2.coorte.anos[1]} (n = ${fmtInt(a2.coorte.n)}; ${fmtPct(a2.coorte.pct_desfavoravel)} desfavorável). ${modo === "ajustada" ? `Regressão logística, n = ${fmtInt(a2.modelo.n)}, pseudo‑R² = ${fmtNum(a2.modelo.pseudo_r2, 2)}.` : "OR bruta (sem ajuste), IC de Woolf."}`}
                   acoes={
                     <div className="segmentado" role="radiogroup" aria-label="Tipo de razão de chances">
                       {(["ajustada", "bruta"] as const).map((m) => (
                         <button key={m} type="button" role="radio" aria-checked={modo === m} className={modo === m ? "ativo" : ""}
                                 onClick={() => setModo(m)}>{m === "ajustada" ? "OR ajustada" : "OR bruta"}</button>
                       ))}
                     </div>
                   }
                   tabela={{ colunas: ["Fator", "OR", "IC 95%", "Detalhe"],
                             linhas: linhas.map((l) => [l.rotulo, fmtNum(l.or, 2), l.li != null ? `${fmtNum(l.li, 2)}–${fmtNum(l.ls, 2)}` : "—", l.detalhe ?? ""]) }}
                   nota="Referências: sexo feminino, raça/cor branca, escolaridade médio completo ou mais, faixa 35–44 anos e ausência da condição. Associação não é causalidade. Privados de liberdade e pessoas com diabetes aparecem com menor chance provavelmente por estarem mais acompanhados (tratamento supervisionado, vínculo com o serviço).">
          <ForestPlot linhas={linhas} />
        </ChartCard>
        <div className="coluna-cards">
          <ChartCard titulo="Efeito acumulado das vulnerabilidades"
                     subtitulo="% de desfecho desfavorável pelo nº de condições entre álcool, drogas, situação de rua e aids"
                     tabela={{ colunas: ["Nº de condições", "Casos", "% observado", "% previsto pelo modelo"],
                               linhas: a2.gradiente.map((g) => [g.n_vulnerabilidades, fmtInt(g.n), fmtPct(g.pct), fmtPct(g.previsto)]) }}>
            <Colunas itens={a2.gradiente.map((g) => ({ rotulo: String(g.n_vulnerabilidades), valor: g.pct, detalhe: `n = ${fmtInt(g.n)}` }))}
                     formato={(v) => fmtPct(v)} rotuloAria="Desfecho desfavorável por número de vulnerabilidades" rotuloX="número de condições" />
          </ChartCard>
          <ChartCard titulo="Quando o desfecho acontece"
                     subtitulo="Dias entre início do tratamento e encerramento, casos novos pulmonares 2015–2023"
                     tabela={{ colunas: ["Desfecho", "n", "Q1", "Mediana", "Q3"], linhas: tempo.map((t) => [t.desfecho, fmtInt(t.n), t.q1, t.mediana, t.q3]) }}>
            <BoxPlot dados={tempo} referencia={{ valor: 180, rotulo: "180 dias (esquema básico)" }} />
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
