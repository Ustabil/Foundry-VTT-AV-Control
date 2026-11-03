import test from "node:test";
import assert from "node:assert/strict";
import { DisplayConnection } from "../scripts/display/connection.js";

test("panel delegates GM actions, preserves unsaved choices and cleans up subscriptions", async () => {
  const previous = Object.fromEntries(["foundry", "game"].map(key => [key, {
    exists: Object.hasOwn(globalThis, key), value: globalThis[key]
  }]));
  try {
    globalThis.game = { user: { isGM: true } };
    class ApplicationDouble {
      rendered = false;
      contexts = [];
      async _prepareContext() { return {}; }
      _canRender() {}
      async _onRender() {}
      _onClose() {}
      async render(options) {
        if (this._canRender(options) === false) return this;
        const context = await this._prepareContext(options);
        this.contexts.push(context);
        const select = {
          value: context.display.selectedId,
          addEventListener: (event, handler) => { select.change = handler; }
        };
        this.element = { querySelector: () => select };
        await this._onRender(context, options);
        this.rendered = true;
        return this;
      }
      close() { this.rendered = false; this._onClose({}); }
    }
    globalThis.foundry = { applications: { api: {
      ApplicationV2: ApplicationDouble,
      HandlebarsApplicationMixin: Base => Base
    } } };
    const { ControlPanel } = await import("../scripts/ui/control-panel.js");
    let selectedId = "screen";
    let writes = 0;
    let probes = 0;
    let failSave = false;
    const display = new DisplayConnection({
      canControl: () => game.user.isGM,
      getSelectedId: () => selectedId,
      getUsers: () => [
        { id: "screen", name: "Shared Screen", active: true },
        { id: "other", name: "Other", active: true }
      ],
      setSelectedId: async id => {
        if (failSave) throw new Error("Persistence failed");
        selectedId = id;
        writes++;
      },
      probe: async () => { probes++; return true; }
    });
    display.start();
    ControlPanel.display = display;
    const panel = new ControlPanel();
    const actions = ControlPanel.DEFAULT_OPTIONS.actions;
    const flush = () => new Promise(resolve => setImmediate(resolve));
    await panel.render({ force: true });
    assert.equal(writes, 0);
    assert.equal(probes, 0);

    const select = panel.element.querySelector("select");
    select.value = "other";
    select.change({ currentTarget: select });
    display.refresh();
    await flush();
    assert.equal(panel.contexts.at(-1).display.selectedId, "other");
    assert.equal(selectedId, "screen");
    await actions.saveDisplay.call(panel);
    await flush();
    assert.equal(selectedId, "other");
    assert.equal(writes, 1);
    assert.equal(panel.contexts.at(-1).saving, false);

    await actions.testDisplay.call(panel);
    await flush();
    assert.equal(probes, 1);
    assert.equal(panel.contexts.at(-1).statusKey, "AVControl.Display.Status.responded");
    assert.equal(panel.contexts.at(-1).testDisabled, false);

    failSave = true;
    panel.element.querySelector("select").value = "screen";
    await actions.saveDisplay.call(panel);
    assert.equal(panel.contexts.at(-1).error, "AVControl.Display.Error.Save");
    assert.equal(panel.contexts.at(-1).saving, false);
    assert.equal(selectedId, "other");

    game.user.isGM = false;
    await actions.saveDisplay.call(panel);
    await actions.testDisplay.call(panel);
    assert.equal(writes, 1);
    assert.equal(probes, 1);
    assert.equal(panel._canRender({}), false);
    game.user.isGM = true;

    panel.close();
    const before = panel.contexts.length;
    display.refresh();
    await flush();
    assert.equal(panel.contexts.length, before);
    await panel.render({ force: true });
    const reopened = panel.contexts.length;
    display.refresh();
    await flush();
    assert.equal(panel.contexts.length, reopened + 1);
    panel.close();
  } finally {
    for (const [key, prior] of Object.entries(previous)) {
      if (prior.exists) globalThis[key] = prior.value;
      else delete globalThis[key];
    }
  }
});
