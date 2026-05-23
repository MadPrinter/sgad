import http from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function createServer() {
  return http.createServer(async (req, res) => {
    if (req.url === "/" || req.url === "/index.html") {
      const html = await readFile(join(__dirname, "../public/index.html"), "utf8");
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(html);
      return;
    }
    if (req.url === "/health") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true, variant: "seed" }));
      return;
    }
    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: { code: "NOT_FOUND" } }));
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  createServer().listen(3000, () => console.log("seed listening on http://localhost:3000"));
}

