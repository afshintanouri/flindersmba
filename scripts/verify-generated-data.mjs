#!/usr/bin/env node
/**
 * Verifies that the generated data shipped with the application matches the
 * reviewed release: the OSCA dataset (public/data/osca/) and the production
 * career data (content/careers/career-directions.generated.json).
 *
 * They are generated outside this repository (from the official ABS workbooks
 * and a reviewed research layer), so here they must not change by hand.
 * Every listed file must match its SHA-256 in data/generated-data.sha256, and
 * public/data/osca/ must contain no unlisted files.
 */
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const MANIFEST = "data/generated-data.sha256";
const lines = readFileSync(MANIFEST, "utf8").split("\n").filter((l) => l.trim() && !l.startsWith("#"));
const expected = new Map(lines.map((l) => {
  const m = l.match(/^([0-9a-f]{64}) {2}(.+)$/);
  if (!m) throw new Error(`${MANIFEST}: malformed line: ${l}`);
  return [m[2], m[1]];
}));

const walk = (dir) => readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : [join(dir, n)]));
const problems = [];
for (const [path, sha] of expected) {
  let actual;
  try {
    actual = createHash("sha256").update(readFileSync(path)).digest("hex");
  } catch {
    problems.push(`missing: ${path}`);
    continue;
  }
  if (actual !== sha) problems.push(`changed: ${path}`);
}
for (const f of walk("public/data/osca").map((f) => f.split("\\").join("/"))) {
  if (!expected.has(f)) problems.push(`unlisted: ${f}`);
}

if (problems.length) {
  console.error(`Generated data does not match ${MANIFEST}:\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
console.log(`OK: ${expected.size} generated files match ${MANIFEST}.`);
