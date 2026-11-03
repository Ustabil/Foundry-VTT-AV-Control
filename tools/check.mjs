import assert from "node:assert/strict";
import { readFile, readdir, access } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { validateRelease } from "./release-config.mjs";

process.chdir(fileURLToPath(new URL("../", import.meta.url)));
const manifest = JSON.parse(await readFile("module.json", "utf8"));
const pkg = JSON.parse(await readFile("package.json", "utf8"));
validateRelease(manifest, pkg);
assert.equal(manifest.id, "av-control");
assert.equal(manifest.version, pkg.version);
assert.ok(manifest.title && manifest.description);
assert.equal(manifest.compatibility.minimum, "14");
assert.equal(manifest.compatibility.maximum, "14");
if (manifest.compatibility.verified) assert.match(manifest.compatibility.verified, /^14(?:\.\d+)?$/);
for (const path of [...manifest.esmodules, ...manifest.styles, ...manifest.languages.map(l => l.path)]) {
  assert.ok(!path.startsWith("/") && !path.split("/").includes(".."));
  await access(path);
}
const translations = JSON.parse(await readFile("lang/en.json", "utf8"));
const template = await readFile("templates/control-panel.hbs", "utf8");
for (const [, key] of template.matchAll(/localize\s+["']([^"']+)["']/g)) {
  assert.equal(typeof translations[key], "string", `Missing translation: ${key}`);
}
async function checkSyntax(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) await checkSyntax(path);
    else if (/\.m?js$/.test(path)) {
      const result = spawnSync(process.execPath, ["--check", path], { encoding: "utf8" });
      assert.equal(result.status, 0, result.stderr);
    }
  }
}
for (const directory of ["scripts", "tests", "tools"]) await checkSyntax(directory);
console.log("Manifest, resources, template translations and JavaScript syntax passed.");
