import type { AnoSel, Meta, Territorio } from "../data/types";

interface Props { meta: Meta; territorio: Territorio; ano: AnoSel; aoMudarTerritorio: (t: Territorio) => void; aoMudarAno: (a: AnoSel) => void }

const codificar = (t: Territorio) => (t.tipo === "BR" ? "BR" : t.tipo === "R" ? `R:${t.regiao}` : `UF:${t.uf}`);
function decodificar(s: string): Territorio {
  if (s.startsWith("R:")) return { tipo: "R", regiao: s.slice(2) };
  if (s.startsWith("UF:")) return { tipo: "UF", uf: s.slice(3) };
  return { tipo: "BR" };
}

/** Uma única linha de filtros, acima de tudo o que ela controla. */
export function Filtros({ meta, territorio, ano, aoMudarTerritorio, aoMudarAno }: Props) {
  return (
    <div className="filtros" role="group" aria-label="Filtros do painel">
      <label className="filtro">
        <span>Ano de diagnóstico</span>
        <select value={String(ano)} onChange={(e) => aoMudarAno(e.target.value === "todos" ? "todos" : Number(e.target.value))}>
          <option value="todos">2015–2025 (todos)</option>
          {meta.anos.slice().reverse().map((a) => (
            <option key={a} value={a}>{a}{meta.status_por_ano[a] === "preliminar" ? " (preliminar)" : ""}</option>
          ))}
        </select>
      </label>
      <label className="filtro">
        <span>Território (residência)</span>
        <select value={codificar(territorio)} onChange={(e) => aoMudarTerritorio(decodificar(e.target.value))}>
          <option value="BR">Brasil</option>
          <optgroup label="Regiões">
            {meta.regioes.map((r) => <option key={r} value={`R:${r}`}>{r}</option>)}
          </optgroup>
          {meta.regioes.map((r) => (
            <optgroup key={r} label={`UFs — ${r}`}>
              {meta.ufs.filter((u) => u.regiao === r).sort((a, b) => a.nome.localeCompare(b.nome))
                .map((u) => <option key={u.sigla} value={`UF:${u.sigla}`}>{u.nome}</option>)}
            </optgroup>
          ))}
        </select>
      </label>
      {(territorio.tipo !== "BR" || ano !== "todos") && (
        <button type="button" className="botao-sec" onClick={() => { aoMudarTerritorio({ tipo: "BR" }); aoMudarAno("todos"); }}>
          Limpar filtros
        </button>
      )}
    </div>
  );
}
