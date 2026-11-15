import { useState, type ReactNode } from "react";

export interface Tabela { colunas: string[]; linhas: (string | number)[][] }

interface Props {
  titulo: string;
  subtitulo?: ReactNode;
  tabela?: Tabela;
  acoes?: ReactNode;
  nota?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Cartão de gráfico: título, subtítulo, alternância gráfico/tabela (acessibilidade) e nota de rodapé. */
export function ChartCard({ titulo, subtitulo, tabela, acoes, nota, children, className }: Props) {
  const [verTabela, setVerTabela] = useState(false);
  return (
    <figure className={`card ${className ?? ""}`}>
      <header className="card-cab">
        <div>
          <h3 className="card-titulo">{titulo}</h3>
          {subtitulo && <p className="card-sub">{subtitulo}</p>}
        </div>
        <div className="card-acoes">
          {acoes}
          {tabela && (
            <button type="button" className="botao-sec" aria-pressed={verTabela} onClick={() => setVerTabela((v) => !v)}>
              {verTabela ? "Ver gráfico" : "Ver tabela"}
            </button>
          )}
        </div>
      </header>
      {verTabela && tabela ? <TabelaDados {...tabela} /> : children}
      {nota && <figcaption className="card-nota">{nota}</figcaption>}
    </figure>
  );
}

export function TabelaDados({ colunas, linhas }: Tabela) {
  return (
    <div className="tabela-rolagem">
      <table className="tabela">
        <thead><tr>{colunas.map((c) => <th key={c} scope="col">{c}</th>)}</tr></thead>
        <tbody>
          {linhas.map((l, i) => (
            <tr key={i}>{l.map((v, j) => (j === 0 ? <th key={j} scope="row">{v}</th> : <td key={j}>{v}</td>))}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
