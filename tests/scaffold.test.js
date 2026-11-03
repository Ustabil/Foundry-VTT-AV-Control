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
  const settings = [];
  const listeners = [];
  let baseChecks = 0;
  const previous = Object.fromEntries(["Hooks", "foundry", "game", "CONFIG"].map(key => [key, {
    exists: Object.hasOwn(globalThis, key), value: globalThis[key]
  }]));
  try {
    globalThis.Hooks = {
      once: (...args) => hooks.push(args),
      on: (...args) => listeners.push(args)
    };
    globalThis.CONFIG = { queries: {} };
    globalThis.foundry = { data: { fields: { StringField: class {} } }, applications: { api: {
      ApplicationV2: class { _canRender() { baseChecks++; } },
      HandlebarsApplicationMixin: Base => class extends Base {}
    } } };
    // Initialization must not write settings, probe clients or touch documents.
    globalThis.game = {
      users: { contents: [] },
      settings: {
        registerMenu: (...args) => menus.push(args),
        register: (...args) => settings.push(args),
        get: () => ""
      }
    };
    await import("../scripts/main.js");
    assert.equal(hooks.length, 2);
    assert.equal(hooks[0][0], "init");
    assert.equal(menus.length, 0);
    hooks[0][1]();
    assert.equal(settings.length, 1);
    assert.equal(settings[0][0], "av-control");
    assert.equal(settings[0][1], "displayUserId");
    assert.equal(settings[0][2].scope, "world");
    assert.equal(settings[0][2].default, "");
    assert.equal(hooks[1][0], "ready");
    hooks[1][1]();
    assert.deepEqual(listeners.map(([name]) => name), ["userConnected", "updateUser", "deleteUser", "createUser"]);
    assert.equal(typeof CONFIG.queries["av-control.displayPresence"], "function");
    assert.equal(await CONFIG.queries["av-control.displayPresence"]({ protocol: 1 }), null);
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
