import { useMemo, useState } from "react";
import { BarList } from "../components/BarList";
import { ChartCard } from "../components/ChartCard";
import { LineChart } from "../components/LineChart";
import { MapaGrade } from "../components/MapaGrade";
import { Piramide } from "../components/Piramide";
import { StatTile, type Estado } from "../components/StatTile";
import { AGRAVOS, chaveA1, Cubo, FAIXAS, indicadores, nomeTerritorio, RACAS } from "../data/cubo";
import type { AnoSel, Dados, Territorio } from "../data/types";
import { SERIE } from "../lib/cores";
import { fmtEixo, fmtInt, fmtNum, fmtPct } from "../lib/formato";

interface Props { dados: Dados; cubo: Cubo; territorio: Territorio; ano: AnoSel; aoMudarTerritorio: (t: Territorio) => void }

type Metrica = "casosNovos" | "cura" | "abandono" | "coinfeccaoHIV";
const METRICAS: { id: Metrica; rotulo: string }[] = [
  { id: "casosNovos", rotulo: "Casos novos" }, { id: "cura", rotulo: "% cura" },
  { id: "abandono", rotulo: "% abandono" }, { id: "coinfeccaoHIV", rotulo: "% TB‑HIV" },
];
const DESFECHO: Metrica[] = ["cura", "abandono"];

export function Painel({ dados, cubo, territorio, ano, aoMudarTerritorio }: Props) {
  const { meta } = dados;
  const [metrica, setMetrica] = useState<Metrica>("cura");
  const anos = meta.anos;
  const ultimoDesf = meta.ultimo_ano_desfecho;
  const nome = nomeTerritorio(territorio, meta);
  const rotuloAno = ano === "todos" ? `${anos[0]}–${anos[anos.length - 1]}` : String(ano);

  const serie = useMemo(() => cubo.serie(territorio).map((s) => ({ ano: s.ano, ...indicadores(s.v), v: s.v })), [cubo, territorio]);
  const atual = useMemo(() => cubo.soma(territorio, ano), [cubo, territorio, ano]);
  const ind = indicadores(atual);

  // Desfechos: em "todos", usa só os anos com encerramento consolidado (até 2023)
  const desfecho = useMemo(() => {
    if (ano !== "todos") return indicadores(atual);
    const soma = serie.filter((s) => s.ano <= ultimoDesf).reduce((acc, s) => {
      for (const k of Object.keys(s.v)) acc[k] = (acc[k] ?? 0) + s.v[k];
      return acc;
    }, {} as Record<string, number>);
    return indicadores(soma);
  }, [ano, atual, serie, ultimoDesf]);
  const rotuloDesf = ano === "todos" ? `${anos[0]}–${ultimoDesf}` : String(ano);
  const avisoDesf = ano !== "todos" && ano > ultimoDesf
    ? `Encerramento incompleto: ${fmtPct(ind.semEncerramento, 0)} dos casos ainda sem desfecho` : undefined;

  const anterior = ano !== "todos" && ano > anos[0] ? indicadores(cubo.soma(territorio, ano - 1)).casosNovos : null;
  const variacao = anterior ? ((ind.casosNovos - anterior) / anterior) * 100 : null;

  const estadoCura: Estado = desfecho.cura == null ? "neutro" : desfecho.cura >= meta.metas.cura ? "bom" : "critico";
  const estadoAband: Estado = desfecho.abandono == null ? "neutro" : desfecho.abandono <= meta.metas.abandono ? "bom" : "critico";

  // A1 — observado vs esperado
  const a1 = dados.a1[chaveA1(territorio)];

  // Mapa por UF
  const mapa = useMemo(() => {
    const out: Record<string, number | null> = {};
    for (const u of meta.ufs) {
      const usarDesf = DESFECHO.includes(metrica) && ano === "todos";
      const linha = usarDesf
        ? anos.filter((a) => a <= ultimoDesf).reduce((acc, a) => {
            const v = cubo.soma({ tipo: "BR" }, a, u.sigla);
            for (const k of Object.keys(v)) acc[k] = (acc[k] ?? 0) + v[k];
            return acc;
          }, {} as Record<string, number>)
        : cubo.soma({ tipo: "BR" }, ano, u.sigla);
      out[u.sigla] = indicadores(linha)[metrica];
    }
    return out;
  }, [cubo, meta.ufs, metrica, ano, anos, ultimoDesf]);
  const nomesUF = Object.fromEntries(meta.ufs.map((u) => [u.sigla, u.nome]));
  const destacadas = territorio.tipo === "UF" ? [territorio.uf]
    : territorio.tipo === "R" ? meta.ufs.filter((u) => u.regiao === territorio.regiao).map((u) => u.sigla) : [];
  const fmtMetrica = (v: number | null) => (metrica === "casosNovos" ? fmtInt(v) : fmtPct(v, 0));

  const masc = FAIXAS.map((_, i) => atual[`m${i}`]);
  const fem = FAIXAS.map((_, i) => atual[`f${i}`]);
  const agravos = AGRAVOS.map((a) => ({
    id: a.id, rotulo: a.rotulo,
    valor: atual[`${a.id}_val`] ? (atual[`${a.id}_sim`] / atual[`${a.id}_val`]) * 100 : null,
    detalhe: `${fmtInt(atual[`${a.id}_sim`])} de ${fmtInt(atual[`${a.id}_val`])} casos com informação`,
  })).sort((a, b) => (b.valor ?? 0) - (a.valor ?? 0));
  const racas = RACAS.map((r) => ({
    id: r.id, rotulo: r.rotulo, valor: atual.casos_novos ? (atual[r.id] / atual.casos_novos) * 100 : null,
    detalhe: `${fmtInt(atual[r.id])} casos novos`,
  }));

  return (
    <div className="painel">
      <p className="contexto">Mostrando <strong>{nome}</strong> · <strong>{rotuloAno}</strong> · por UF de residência e ano de diagnóstico</p>

      <section className="stats" aria-label="Indicadores principais">
        <StatTile rotulo={`Casos novos · ${rotuloAno}`} valor={fmtInt(ind.casosNovos)}
                  detalhe={variacao != null ? `${variacao >= 0 ? "+" : "−"}${fmtNum(Math.abs(variacao))}% em relação a ${(ano as number) - 1}`
                    : ano === "todos" ? `média de ${fmtInt(ind.casosNovos / anos.length)} por ano` : undefined} />
        <StatTile rotulo={`Cura · ${rotuloDesf}`} valor={fmtPct(desfecho.cura)} estado={estadoCura}
                  textoEstado={estadoCura === "bom" ? "Meta atingida (≥ 85%)" : "Abaixo da meta de 85%"}
                  detalhe="casos novos pulmonares" aviso={avisoDesf} />
        <StatTile rotulo={`Abandono · ${rotuloDesf}`} valor={fmtPct(desfecho.abandono)} estado={estadoAband}
                  textoEstado={estadoAband === "bom" ? "Meta atingida (≤ 5%)" : "Acima da meta de 5%"}
                  detalhe="inclui abandono primário" aviso={avisoDesf} />
        <StatTile rotulo={`Óbito por TB · ${rotuloDesf}`} valor={fmtPct(desfecho.obitoTB)} detalhe="casos novos pulmonares" aviso={avisoDesf} />
        <StatTile rotulo={`Testagem para HIV · ${rotuloAno}`} valor={fmtPct(ind.testagemHIV)}
                  detalhe={`coinfecção TB‑HIV: ${fmtPct(ind.coinfeccaoHIV)}`} />
        <StatTile rotulo={`Teste rápido molecular · ${rotuloAno}`} valor={fmtPct(ind.trm)} detalhe="casos novos pulmonares testados" />
      </section>

      <div className="grade-2">
        <ChartCard titulo="Casos novos: observado e esperado"
                   subtitulo={<>Esperado = tendência linear de 2015–2019 projetada, com intervalo de predição de 95%. {nome}.</>}
                   tabela={{ colunas: ["Ano", "Observado", "Esperado", "IP 95% inf.", "IP 95% sup.", "O/E"],
                             linhas: a1.serie.map((p) => [p.ano, fmtInt(p.observado), fmtInt(p.esperado), fmtInt(p.ip_inf), fmtInt(p.ip_sup), fmtNum(p.oe, 2)]) }}
                   nota={<>2020–2021: {fmtInt(Math.abs(a1.deficit_2020_2021))} casos {a1.deficit_2020_2021 < 0 ? "a menos" : "a mais"} que o esperado ({fmtNum(a1.deficit_pct)}%).
                     {territorio.tipo === "UF" && " Em UFs pequenas a tendência é instável: interprete com cautela."}</>}>
          <LineChart x={anos}
                     series={[{ id: "obs", nome: "Observado", cor: SERIE[0], valores: a1.serie.map((p) => p.observado) },
                              { id: "esp", nome: "Esperado (tendência 2015–2019)", cor: "var(--mudo)", tracejada: true, valores: a1.serie.map((p) => p.esperado) }]}
                     banda={{ nome: "Intervalo de predição 95%", cor: "var(--mudo)", inf: a1.serie.map((p) => p.ip_inf), sup: a1.serie.map((p) => p.ip_sup) }}
                     marcaX={ano === "todos" ? undefined : ano} incluirZero={false}
                     formatoY={fmtEixo} formatoValor={(v) => fmtInt(v)} />
        </ChartCard>

        <ChartCard titulo="Desfechos do tratamento (%)"
                   subtitulo={<>Casos novos pulmonares por ano de diagnóstico. Metas: cura ≥ 85%, abandono ≤ 5%. {nome}.</>}
                   tabela={{ colunas: ["Ano", "Cura", "Abandono", "Óbito por TB", "Sem encerramento"],
                             linhas: serie.map((s) => [s.ano, fmtPct(s.cura), fmtPct(s.abandono), fmtPct(s.obitoTB), fmtPct(s.semEncerramento)]) }}
                   nota="A partir de 2024 muitos casos ainda não foram encerrados no SINAN: a queda da cura nesses anos é, em boa parte, falta de informação.">
          <LineChart x={anos} yDominio={[0, 100]}
                     series={[{ id: "cura", nome: "Cura", cor: SERIE[0], valores: serie.map((s) => s.cura) },
                              { id: "aband", nome: "Abandono", cor: SERIE[1], valores: serie.map((s) => s.abandono) },
                              { id: "obito", nome: "Óbito por TB", cor: SERIE[2], valores: serie.map((s) => s.obitoTB) }]}
                     referencias={[{ valor: meta.metas.cura, rotulo: "meta 85%" }, { valor: meta.metas.abandono, rotulo: "meta 5%" }]}
                     sombreado={{ de: ultimoDesf + 1, ate: anos[anos.length - 1], rotulo: "encerramento incompleto" }}
                     marcaX={ano === "todos" ? undefined : ano}
                     formatoY={(v) => `${v}%`} formatoValor={(v) => fmtPct(v)} />
        </ChartCard>
      </div>

      <div className="grade-2">
        <ChartCard titulo={`Por UF — ${METRICAS.find((m) => m.id === metrica)!.rotulo}, ${DESFECHO.includes(metrica) ? rotuloDesf : rotuloAno}`}
                   subtitulo="Clique numa UF para filtrá-la. A escala de cores está abaixo do mapa."
                   acoes={
                     <div className="segmentado" role="radiogroup" aria-label="Métrica do mapa">
                       {METRICAS.map((m) => (
                         <button key={m.id} type="button" role="radio" aria-checked={metrica === m.id}
                                 className={metrica === m.id ? "ativo" : ""} onClick={() => setMetrica(m.id)}>{m.rotulo}</button>
                       ))}
                     </div>
                   }
                   tabela={{ colunas: ["UF", METRICAS.find((m) => m.id === metrica)!.rotulo],
                             linhas: meta.ufs.map((u) => [u.nome, fmtMetrica(mapa[u.sigla])]) }}
                   nota={DESFECHO.includes(metrica) && ano !== "todos" && ano > ultimoDesf ? "Atenção: encerramento ainda incompleto neste ano." : undefined}>
          <MapaGrade valores={mapa} nomes={nomesUF} formato={fmtMetrica} destacadas={destacadas}
                     aoClicar={(uf) => aoMudarTerritorio({ tipo: "UF", uf })} rotuloAria="Mapa em grade das UFs" />
        </ChartCard>

        <div className="coluna-cards">
          <ChartCard titulo="Tipo de entrada (% das notificações)"
                     subtitulo={<>Reingresso após abandono, recidiva e transferência. {nome}.</>}
                     tabela={{ colunas: ["Ano", "Reingresso após abandono", "Recidiva", "Transferência", "Notificações"],
                               linhas: serie.map((s) => [s.ano, fmtPct(s.reingresso), fmtPct(s.recidiva), fmtPct(s.transferencia), fmtInt(s.notificacoes)]) }}
                     nota="Algumas UFs não usam certos campos no SINAN: um valor de 0% pode significar campo não preenchido (veja a aba Qualidade dos dados).">
            <LineChart x={anos}
                       series={[{ id: "reing", nome: "Reingresso após abandono", cor: SERIE[1], valores: serie.map((s) => s.reingresso) },
                                { id: "recid", nome: "Recidiva", cor: SERIE[0], valores: serie.map((s) => s.recidiva) },
                                { id: "transf", nome: "Transferência", cor: SERIE[2], valores: serie.map((s) => s.transferencia) }]}
                       marcaX={ano === "todos" ? undefined : ano}
                       formatoY={(v) => `${fmtNum(v, 0)}%`} formatoValor={(v) => fmtPct(v)} />
          </ChartCard>
          <ChartCard titulo="Raça/cor" subtitulo="% dos casos novos"
                     tabela={{ colunas: ["Raça/cor", "%", "Casos"], linhas: racas.map((r) => [r.rotulo, fmtPct(r.valor), r.detalhe]) }}>
            <BarList itens={racas} formato={(v) => fmtPct(v)} max={100} rotuloAria="Raça/cor dos casos novos" />
          </ChartCard>
        </div>
      </div>

      <h2 className="secao">Perfil dos casos novos · {nome} · {rotuloAno}</h2>
      <div className="grade-2">
        <ChartCard titulo="Sexo e faixa etária" subtitulo="% do total de casos novos com sexo e idade informados"
                   tabela={{ colunas: ["Faixa etária", "Masculino", "Feminino"], linhas: FAIXAS.map((f, i) => [f, fmtInt(masc[i]), fmtInt(fem[i])]) }}>
          <Piramide faixas={FAIXAS} masculino={masc} feminino={fem} />
        </ChartCard>
        <ChartCard titulo="Agravos e populações especiais" subtitulo="% Sim entre casos com a informação preenchida (ignorados fora)"
                   tabela={{ colunas: ["Condição", "% Sim", "Detalhe"], linhas: agravos.map((a) => [a.rotulo, fmtPct(a.valor), a.detalhe]) }}
                   nota="Beneficiário de transferência de renda tem ~40% de incompletude.">
          <BarList itens={agravos} formato={(v) => fmtPct(v)} rotuloAria="Agravos e populações especiais" />
        </ChartCard>
      </div>
    </div>
  );
}
