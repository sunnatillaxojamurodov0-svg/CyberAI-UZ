import {
  cpSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "fs";
import { join } from "path";

const srv = "dist/server";
const out = ".output/server";

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

for (const e of readdirSync(srv)) {
  const s = join(srv, e);
  const d = join(out, e);
  if (statSync(s).isDirectory()) {
    cpSync(s, join(out, e), { recursive: true });
  } else {
    copyFileSync(s, d);
  }
}

const srcFile = existsSync(join(out, "index.js")) ? "index.js" : "server.js";
renameSync(join(out, srcFile), join(out, "index.mjs"));

for (const f of readdirSync(join(out, "assets"))) {
  const fp = join(out, "assets", f);
  if (f.endsWith(".js")) {
    let c = readFileSync(fp, "utf8");
    if (c.includes("../server.js") || c.includes("../index.js")) {
      c = c.replaceAll("../server.js", "../index.mjs").replaceAll("../index.js", "../index.mjs");
      writeFileSync(fp, c);
    }
  }
}

let idx = readFileSync(join(out, "index.mjs"), "utf8");
idx = idx.replace(/\n  db as d,/g, "\n");
writeFileSync(join(out, "index.mjs"), idx);

console.log("copied -> .output/server");
