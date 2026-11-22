// Minimal dependency-free static server for the exported site.
// Serves a directory under a base path, mirroring a GitHub Pages project site.
// Usage: node scripts/serve-static.mjs [dir=out] [port=4173] [basePath=/flindersmba]
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";

const dir = resolve(process.argv[2] || "out");
const port = Number(process.argv[3] || 4173);
const base = (process.argv[4] ?? "/flindersmba").replace(/\/$/, "");

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};

createServer(async (req, res) => {
  const url = new URL(req.url || "/", "http://localhost");
  let path = decodeURIComponent(url.pathname);
  if (base && path === base) {
    res.writeHead(301, { Location: base + "/" });
    return res.end();
  }
  if (base && !path.startsWith(base + "/")) {
    res.writeHead(404);
    return res.end("Not found (outside base path " + base + ")");
  }
  path = path.slice(base.length);
  let file = normalize(join(dir, path));
  if (!file.startsWith(dir)) {
    res.writeHead(403);
    return res.end();
  }
  try {
    if ((await stat(file)).isDirectory()) file = join(file, "index.html");
    const body = await readFile(file);
    res.writeHead(200, { "Content-Type": types[extname(file)] || "application/octet-stream" });
    res.end(body);
  } catch {
    try {
      const body = await readFile(join(dir, "404.html"));
      res.writeHead(404, { "Content-Type": types[".html"] });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  }
}).listen(port, () => {
  console.log(`Serving ${dir} at http://localhost:${port}${base}/`);
});
