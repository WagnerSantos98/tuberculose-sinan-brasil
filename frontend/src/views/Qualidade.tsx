import { ChartCard } from "../components/ChartCard";
import type { Dados } from "../data/types";
import { fmtNum } from "../lib/formato";

const CLASSES = [
  { nome: "Excelente", ate: 5 }, { nome: "Bom", ate: 10 }, { nome: "Regular", ate: 20 },
  { nome: "Ruim", ate: 50 }, { nome: "Muito ruim", ate: Infinity },
];
const classeDe = (p: number) => CLASSES.findIndex((c) => p < c.ate);

export function Qualidade({ dados }: { dados: Dados }) {
  const { completude, meta } = dados;
  const anos = meta.anos.map(String);
  return (
    <div className="painel">
      <p className="contexto">Completude das variáveis entre <strong>casos novos</strong> no Brasil — campos em branco + “ignorado”, classificados pelo escore de Romero &amp; Cunha (2006).</p>
      <ChartCard titulo="Percentual de incompletude por variável e ano"
                 subtitulo="Calculado pela função avaliar_incompletude() do pacote analytics. Quanto mais escuro, pior o preenchimento."
                 nota="O encerramento de 2024 e 2025 ainda está em aberto no SINAN: por isso as análises de desfecho vão até 2023.">
        <div className="legenda-classes" aria-label="Classes de completude">
          {CLASSES.map((c, i) => (
            <span key={c.nome}><span className={`amostra classe-${i}`} />{c.nome} {i === 0 ? "< 5%" : i === 4 ? "≥ 50%" : `${CLASSES[i - 1].ate}–${c.ate}%`}</span>
          ))}
        </div>
        <div className="tabela-rolagem">
          <table className="tabela calor">
            <thead>
              <tr><th scope="col">Variável</th><th scope="col">Geral</th><th scope="col">Classificação</th>
                {anos.map((a) => <th key={a} scope="col">{a}</th>)}</tr>
            </thead>
            <tbody>
              {completude.variaveis.map((v) => (
                <tr key={v.variavel}>
                  <th scope="row">{v.rotulo}</th>
                  <td className={`classe-${classeDe(v.pct_incompleto)}`}>{fmtNum(v.pct_incompleto)}</td>
                  <td className="texto-esq">{v.classificacao}</td>
                  {anos.map((a) => (
                    <td key={a} className={`classe-${classeDe(v.por_ano[a])}`}>{fmtNum(v.por_ano[a])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}
