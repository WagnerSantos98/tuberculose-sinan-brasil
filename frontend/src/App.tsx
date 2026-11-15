import { useEffect, useMemo, useState } from "react";
import { Filtros } from "./components/Filtros";
import { carregarDados } from "./data/carregar";
import { Cubo } from "./data/cubo";
import type { AnoSel, Dados, Territorio } from "./data/types";
import { Analises } from "./views/Analises";
import { Painel } from "./views/Painel";
import { Qualidade } from "./views/Qualidade";
import { Sobre } from "./views/Sobre";

type Aba = "painel" | "analises" | "qualidade" | "sobre";
const ABAS: { id: Aba; rotulo: string }[] = [
  { id: "painel", rotulo: "Painel" }, { id: "analises", rotulo: "Análises" },
  { id: "qualidade", rotulo: "Qualidade dos dados" }, { id: "sobre", rotulo: "Sobre" },
];

function lerTema(): "claro" | "escuro" | null {
  try { const t = localStorage.getItem("tema"); return t === "claro" || t === "escuro" ? t : null; } catch { return null; }
}

export default function App() {
  const [dados, setDados] = useState<Dados | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aba, setAba] = useState<Aba>("painel");
  const [territorio, setTerritorio] = useState<Territorio>({ tipo: "BR" });
  const [ano, setAno] = useState<AnoSel>("todos");
  const [tema, setTema] = useState<"claro" | "escuro" | null>(lerTema);

  useEffect(() => { carregarDados().then(setDados).catch((e: Error) => setErro(e.message)); }, []);
  useEffect(() => {
    if (tema) document.documentElement.dataset.theme = tema === "escuro" ? "dark" : "light";
    else delete document.documentElement.dataset.theme;
    try { if (tema) localStorage.setItem("tema", tema); } catch { /* armazenamento indisponível */ }
  }, [tema]);

  const cubo = useMemo(() => (dados ? new Cubo(dados.cubo, dados.meta) : null), [dados]);
  const escuroAtual = tema === "escuro" || (tema == null && window.matchMedia?.("(prefers-color-scheme: dark)").matches);

  return (
    <div className="app">
      <header className="topo">
        <div>
          <p className="sobretitulo">SINAN · Ministério da Saúde</p>
          <h1>Tuberculose no Brasil, 2015–2025</h1>
        </div>
        <div className="topo-acoes">
          <span className="selo"><span className="estado-icone estado-atencao-icone" aria-hidden="true">!</span>2020–2025: dados preliminares</span>
          <button type="button" className="botao-sec" onClick={() => setTema(escuroAtual ? "claro" : "escuro")}>
            {escuroAtual ? "Tema claro" : "Tema escuro"}
          </button>
        </div>
      </header>

      <nav className="abas" aria-label="Seções">
        {ABAS.map((a) => (
          <button key={a.id} type="button" className={aba === a.id ? "ativa" : ""} aria-current={aba === a.id ? "page" : undefined}
                  onClick={() => setAba(a.id)}>{a.rotulo}</button>
        ))}
      </nav>

      <main>
        {erro && (
          <div className="card erro" role="alert">
            <h3 className="card-titulo">Não foi possível carregar os dados do painel</h3>
            <p>{erro}</p>
            <p>Gere os arquivos com <code>docker compose --profile analytics run --rm analytics</code> (ou <code>python -m tb_analytics exportar</code>) e recarregue a página.</p>
          </div>
        )}
        {!dados && !erro && <p className="carregando">Carregando dados…</p>}
        {dados && cubo && (
          <>
            {aba === "painel" && (
              <>
                <Filtros meta={dados.meta} territorio={territorio} ano={ano} aoMudarTerritorio={setTerritorio} aoMudarAno={setAno} />
                <Painel dados={dados} cubo={cubo} territorio={territorio} ano={ano} aoMudarTerritorio={setTerritorio} />
              </>
            )}
            {aba === "analises" && <Analises dados={dados} />}
            {aba === "qualidade" && <Qualidade dados={dados} />}
            {aba === "sobre" && <Sobre dados={dados} />}
          </>
        )}
      </main>
      <footer className="rodape">
        Fonte: SINAN/DATASUS · Projeto final — Programação e Análise de Dados em Saúde · Wagner Santos de Jesus
      </footer>
    </div>
  );
}
