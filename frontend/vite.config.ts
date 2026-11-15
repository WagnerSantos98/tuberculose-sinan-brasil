import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { createReadStream, existsSync, statSync } from "node:fs";
import { resolve, normalize, sep } from "node:path";

/**
 * Em desenvolvimento (`npm run dev` / `npm run preview`) serve os JSON gerados pelo
 * analytics (pasta ../painel-dados, ou PAINEL_DADOS) no caminho /data/.
 * No Docker quem serve /data/ é o nginx, a partir de um volume — os dados NÃO entram no bundle.
 */
function dadosDoPainel(): Plugin {
  const pasta = resolve(process.env.PAINEL_DADOS ?? resolve(__dirname, "../painel-dados"));
  const middleware = (req: { url?: string }, res: any, next: () => void) => {
    const url = (req.url ?? "").split("?")[0];
    const m = url.match(/\/data\/([\w.-]+\.json)$/);
    if (!m) return next();
    const arquivo = normalize(resolve(pasta, m[1]));
    if (!arquivo.startsWith(pasta + sep) || !existsSync(arquivo) || !statSync(arquivo).isFile()) {
      res.statusCode = 404;
      return res.end("not found");
    }
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    createReadStream(arquivo).pipe(res);
  };
  return {
    name: "dados-do-painel",
    configureServer(server) { server.middlewares.use(middleware); },
    configurePreviewServer(server) { server.middlewares.use(middleware); },
  };
}

export default defineConfig({
  base: "./",
  plugins: [react(), dadosDoPainel()],
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
});
