import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateRelease } from "../tools/release-config.mjs";

const manifest = JSON.parse(await readFile(new URL("../module.json", import.meta.url)));
const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url)));

test("release metadata binds latest discovery to an exact version download", () => {
  assert.doesNotThrow(() => validateRelease(manifest, pkg, `v${pkg.version}`));
  for (const tag of [pkg.version, "v99.0.0", "v0.1.0-beta.1", "../main"]) {
    assert.throws(() => validateRelease(manifest, pkg, tag));
  }
  for (const change of [
    { id: "other" }, { version: "99.0.0" },
    { download: manifest.manifest.replace("module.json", "av-control.zip") },
    { manifest: manifest.download.replace("av-control.zip", "module.json") }
  ]) assert.throws(() => validateRelease({ ...manifest, ...change }, pkg));
});
