import assert from "node:assert/strict";
import { readFile, readdir, mkdir, rm, copyFile, lstat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { validateRelease, REPOSITORY } from "./release-config.mjs";

process.chdir(fileURLToPath(new URL("../", import.meta.url)));
const manifest = JSON.parse(await readFile("module.json", "utf8"));
const pkg = JSON.parse(await readFile("package.json", "utf8"));
validateRelease(manifest, pkg, process.argv[2]);
if (process.env.GITHUB_ACTIONS === "true") {
  assert.equal(process.env.GITHUB_REPOSITORY, REPOSITORY);
}

// Explicit runtime allowlist: documentation, tests and tooling never enter the ZIP.
const files = ["module.json"];
async function collect(directory, extension) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`;
    assert.ok(!entry.isSymbolicLink(), `Runtime symlink is not allowed: ${path}`);
    if (entry.isDirectory()) await collect(path, extension);
    else if (entry.isFile() && path.endsWith(extension)) files.push(path);
  }
}
await collect("scripts", ".js");
await collect("templates", ".hbs");
await collect("styles", ".css");
await collect("lang", ".json");
assert.ok((await lstat("module.json")).isFile());
files.sort();
await mkdir("dist", { recursive: true });
await rm("dist/av-control.zip", { force: true });
function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  assert.equal(result.status, 0, result.error?.message ?? result.stderr);
  return result.stdout;
}
run("zip", ["-X", "-q", "dist/av-control.zip", ...files]);
run("unzip", ["-t", "dist/av-control.zip"]);
assert.deepEqual(run("unzip", ["-Z1", "dist/av-control.zip"]).trim().split("\n").sort(), files);
const source = await readFile("module.json", "utf8");
assert.equal(run("unzip", ["-p", "dist/av-control.zip", "module.json"]), source);
await copyFile("module.json", "dist/module.json");
console.log(`Packaged ${manifest.id} ${manifest.version}: ${files.length} runtime files; manifests match.`);
