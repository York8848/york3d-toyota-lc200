import {
  readFileSync,
  existsSync,
  readdirSync,
  mkdirSync,
  writeFileSync,
  copyFileSync,
} from "node:fs";
const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
mkdirSync("THIRD_PARTY_LICENSES", { recursive: true });
const rows = [];
for (const [path, info] of Object.entries(lock.packages)) {
  if (!path || !existsSync(path + "/package.json")) continue;
  const pkg = JSON.parse(readFileSync(path + "/package.json", "utf8"));
  const safe =
    pkg.name.replaceAll("/", "__").replaceAll("@", "") + "-" + pkg.version;
  const matches = readdirSync(path).filter((n) =>
    /^(license|copying|notice)(\.|$)/i.test(n),
  );
  for (const name of matches) {
    try {
      copyFileSync(
        path + "/" + name,
        "THIRD_PARTY_LICENSES/" + safe + "-" + name,
      );
    } catch {}
  }
  rows.push(
    `| ${pkg.name} | ${pkg.version} | ${pkg.license ?? info.license ?? "See package"} | ${matches.length ? "Preserved in THIRD_PARTY_LICENSES/" : "See installed package"} |`,
  );
}
writeFileSync(
  "THIRD_PARTY_LICENSES.md",
  "# Third-party dependency licenses\n\nGenerated from package-lock.json and installed packages using `npm run licenses`. Includes runtime and development dependencies; platform-specific optional dependencies are listed only when installed. Full upstream notices are preserved in `THIRD_PARTY_LICENSES/`. Three.js addon geometry, controls, environment, tessellation and geometry utilities use the Three.js MIT license. No external vehicle model, texture, photo or reference-site asset is included.\n\n| Package | Version | License | Notice |\n|---|---|---|---|\n" +
    rows.join("\n") +
    "\n",
);
console.log(`Recorded ${rows.length} installed dependency notices.`);
