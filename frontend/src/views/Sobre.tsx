import type { Dados } from "../data/types";
import { fmtData, fmtInt } from "../lib/formato";

export function Sobre({ dados }: { dados: Dados }) {
  const { meta } = dados;
  const r = meta.resumo;
  return (
    <div className="painel sobre">
      <div className="card texto">
        <h3 className="card-titulo">Fonte dos dados</h3>
        <p>{meta.fonte}. Arquivos por ano de diagnóstico, {meta.anos[0]}–{meta.anos[meta.anos.length - 1]}:
          {" "}{fmtInt(r.registros_brutos)} notificações e {r.variaveis_brutas} variáveis; {r.duplicatas_removidas} duplicatas exatas removidas;
          {" "}{fmtInt(r.casos_novos)} casos novos.</p>
        <p><strong>Status:</strong> {Object.entries(meta.status_por_ano).filter(([, s]) => s === "final").map(([a]) => a).join(", ")} são bases finais;
          {" "}{Object.entries(meta.status_por_ano).filter(([, s]) => s === "preliminar").map(([a]) => a).join(", ")} são preliminares e podem mudar.</p>
        <p className="cautela">Dados gerados em {fmtData(meta.gerado_em)}. O painel mostra apenas agregados por UF e ano — nenhum registro individual.</p>
      </div>
      <div className="card texto">
        <h3 className="card-titulo">Definições</h3>
        <ul>
          {Object.entries(meta.definicoes).map(([k, v]) => <li key={k}><strong>{k.replace(/_/g, " ")}:</strong> {v}</li>)}
          <li><strong>testagem para HIV:</strong> casos novos com resultado positivo, negativo ou em andamento.</li>
          <li><strong>território:</strong> UF de residência informada na notificação (registros sem UF entram apenas no total Brasil).</li>
        </ul>
      </div>
      <div className="card texto">
        <h3 className="card-titulo">Limitações</h3>
        <ul>
          <li>A unidade é a notificação, não a pessoa: transferências e reingressos podem contar a mesma pessoa mais de uma vez.</li>
          <li>Sem população no denominador: o painel mostra contagens e proporções, não taxas de incidência.</li>
          <li>Campos “ignorado” e subnotificação de condições estigmatizadas (álcool, drogas) podem subestimar proporções.</li>
          <li>As associações da aba Análises vêm de um desenho observacional e não indicam causalidade.</li>
        </ul>
      </div>
      <div className="card texto">
        <h3 className="card-titulo">Como reproduzir</h3>
        <p>O painel lê os arquivos JSON gerados pelo pacote <code>tb_analytics</code> (pasta <code>analytics/</code>). Com Docker:</p>
        <pre className="codigo">{`docker compose --profile analytics run --rm analytics
docker compose up -d frontend`}</pre>
        <p>Detalhes no README do repositório.</p>
      </div>
    </div>
  );
}
