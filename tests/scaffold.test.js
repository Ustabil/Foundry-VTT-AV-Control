import test from "node:test";
import assert from "node:assert/strict";
import { canControl } from "../scripts/core/permissions.js";

test("only GMs satisfy the control policy", () => {
  for (const user of [undefined, null, {}, { isGM: false }, { isGM: "true" }]) {
    assert.equal(canControl(user), false);
  }
  assert.equal(canControl({ isGM: true }), true);
});

test("entry point registers initialization and a restricted, guarded panel", async () => {
  const hooks = [];
  const menus = [];
  let baseChecks = 0;
  const previous = Object.fromEntries(["Hooks", "foundry", "game"].map(key => [key, {
    exists: Object.hasOwn(globalThis, key), value: globalThis[key]
  }]));
  try {
    globalThis.Hooks = { once: (...args) => hooks.push(args) };
    globalThis.foundry = { applications: { api: {
      ApplicationV2: class { _canRender() { baseChecks++; } },
      HandlebarsApplicationMixin: Base => class extends Base {}
    } } };
    // Deliberately supply no socket, documents or settings.set API:
    // initialization must need none of them.
    globalThis.game = { settings: { registerMenu: (...args) => menus.push(args) } };
    await import("../scripts/main.js");
    assert.equal(hooks.length, 1);
    assert.equal(hooks[0][0], "init");
    assert.equal(menus.length, 0);
    hooks[0][1]();
    assert.equal(menus.length, 1);
    const [namespace, key, config] = menus[0];
    assert.equal(namespace, "av-control");
    assert.equal(key, "controlPanel");
    assert.equal(config.restricted, true);
    const panel = new config.type();
    for (const user of [undefined, { isGM: false }]) {
      game.user = user;
      assert.equal(panel._canRender({}), false);
    }
    assert.equal(baseChecks, 0);
    game.user = { isGM: true };
    assert.equal(panel._canRender({}), undefined);
    assert.equal(baseChecks, 1);
    assert.equal(config.type.PARTS.content.template, "modules/av-control/templates/control-panel.hbs");
  } finally {
    for (const [key, prior] of Object.entries(previous)) {
      if (prior.exists) globalThis[key] = prior.value;
      else delete globalThis[key];
    }
  }
});
