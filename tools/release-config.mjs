import assert from "node:assert/strict";

export const REPOSITORY = "Ustabil/Foundry-VTT-AV-Control";
export const BASE_URL = `https://github.com/${REPOSITORY}`;

/** Fail closed: releases use stable numeric versions and exactly matching tags. */
export function validateRelease(manifest, pkg, tag = `v${pkg.version}`) {
  assert.match(pkg.version, /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/);
  assert.equal(manifest.id, "av-control");
  assert.equal(manifest.version, pkg.version);
  assert.equal(tag, `v${pkg.version}`, "Tag must be v + the package/module version");
  assert.equal(manifest.url, BASE_URL);
  assert.equal(manifest.manifest, `${BASE_URL}/releases/latest/download/module.json`);
  assert.equal(manifest.download, `${BASE_URL}/releases/download/${tag}/av-control.zip`);
}
