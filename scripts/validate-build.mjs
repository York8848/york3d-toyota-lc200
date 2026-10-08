import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import assert from "node:assert/strict";
assert(existsSync("dist/index.html"));
const html = readFileSync("dist/index.html", "utf8");
for (const [, p] of html.matchAll(/(?:src|href)="(\/[^"#]+)"/g))
  assert(existsSync("dist" + p), `missing ${p}`);
const files = [];
function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = dir + "/" + f;
    if (statSync(p).isDirectory()) walk(p);
    else files.push(p);
  }
}
walk("dist");
for (const f of files.filter((f) => /\.(js|css|html)$/.test(f))) {
  const s = readFileSync(f, "utf8");
  assert(!s.includes("tina-3d-tesla.vercel.app"), "Reference asset dependency");
}
writeFileSync(
  "reports/build-validation.json",
  JSON.stringify(
    {
      checkedAt: new Date().toISOString(),
      status: "passed",
      files: files.map((path) => ({ path, bytes: statSync(path).size })),
      checks: [
        "entry asset references exist",
        "no reference website runtime dependency",
      ],
    },
    null,
    2,
  ),
);
console.log("Production files verified.");
