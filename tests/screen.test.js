import test from "node:test";
import assert from "node:assert/strict";
import { DisplayScreen } from "../scripts/display/screen.js";
import { createScreenAdapter } from "../scripts/display/foundry-screen.js";
import { IDLE_DISPLAY_STATE, parseDisplayState } from "../scripts/display/state.js";
import { ViewControl } from "../scripts/core/view-control.js";

const command = (mode = "shared", revision = "one") => ({
  protocol: 1, mode, userId: "screen", sceneId: mode === "shared" ? "scene" : "",
  tokenIds: mode === "shared" ? ["a", "b"] : [], revision
});

test("state protocol rejects DM modes, empty vision, duplicates and invalid data", () => {
  assert.equal(parseDisplayState(IDLE_DISPLAY_STATE).mode, "idle");
  assert.equal(parseDisplayState(JSON.stringify(command())).mode, "shared");
  for (const patch of [
    { mode: "gm" }, { protocol: 2 }, { tokenIds: [] }, { tokenIds: ["a", "a"] },
    { tokenIds: [null] }, { userId: "" }, { sceneId: "" }, { revision: "" }
  ]) assert.throws(() => parseDisplayState(JSON.stringify({ ...command(), ...patch })));
});

function screenFixture() {
  const state = { target: true, config: command(), covers: [], applied: [], restore: 0, apply: async () => {} };
  const screen = new DisplayScreen({
    isTarget: () => state.target,
    getUserId: () => "screen",
    getConfig: () => JSON.stringify(state.config),
    cover: value => state.covers.push(value),
    restore: () => state.restore++,
    applyShared: async config => { state.applied.push(config); await state.apply(); }
  });
  return { screen, state };
}

test("shared rendering stays covered until complete; a later blackout wins over an old apply", async () => {
  const { screen, state } = screenFixture();
  let finish;
  state.apply = () => new Promise(resolve => { finish = resolve; });
  const first = screen.sync();
  assert.equal(state.covers.at(-1), true);
  state.config = command("black", "two");
  await screen.sync();
  finish();
  await first;
  assert.deepEqual(await screen.status(), { state: "black", revision: "two", error: "" });
  assert.ok(state.covers.every(value => value === true));
});

test("failed shared setup is black, non-target clients never apply commands, and idle restores", async () => {
  const { screen, state } = screenFixture();
  state.apply = async () => { throw new Error("AVControl.View.Error.Ownership"); };
  await screen.sync();
  assert.equal(state.covers.at(-1), true);
  assert.equal((await screen.status()).error, "AVControl.View.Error.Ownership");
  state.target = false;
  await screen.sync();
  assert.equal(state.applied.length, 1);
  assert.equal(state.covers.at(-1), false);
  state.target = true;
  state.config = JSON.parse(IDLE_DISPLAY_STATE);
  await screen.sync();
  assert.equal((await screen.status()).state, "idle");
  assert.equal(state.covers.at(-1), false);
});

function canvasFixture() {
  const user = { id: "screen" };
  const canvas = {
    ready: true,
    scene: { id: "scene", tokenVision: true, levels: { size: 1 }, fog: { exploration: "individual" } },
    perception: { initialize: () => { canvas.refreshes++; } }, refreshes: 0
  };
  const controls = [];
  const objects = new Map();
  for (const id of ["a", "b", "extra"]) {
    const actor = { hasPlayerOwner: true, testUserPermission: (who, level) => who === user && level === "OWNER" };
    const token = {
      id, actor, document: { actor, sight: { enabled: true }, hidden: false },
      control: options => {
        assert.equal(options.releaseOthers, false);
        assert.equal(options.pan, false);
        assert.equal(options.force, undefined);
        controls.push(id);
        canvas.tokens.controlled.push(token);
        return true;
      }
    };
    objects.set(id, token);
  }
  canvas.tokens = {
    controlled: [], get: id => objects.get(id), activate() {},
    releaseAll() { this.controlled = []; }
  };
  const document = { createElement: () => ({ style: {}, setAttribute() {}, remove() {} }), body: { append() {} } };
  const adapter = createScreenAdapter({ getCanvas: () => canvas, getUser: () => user, document, nextFrame: async () => {} });
  return { canvas, adapter, controls, objects };
}

test("native shared vision controls exactly chosen tokens, without force, panning or fog changes", async () => {
  const { canvas, adapter, controls } = canvasFixture();
  const fogBefore = JSON.stringify(canvas.scene.fog);
  await adapter.applyShared(command());
  assert.deepEqual(controls, ["a", "b"]);
  assert.deepEqual(canvas.tokens.controlled.map(t => t.id), ["a", "b"]);
  assert.equal(canvas.refreshes, 1);
  assert.equal(JSON.stringify(canvas.scene.fog), fogBefore);
  adapter.restore();
  assert.equal(canvas.tokens.controlled.length, 0);
});

test("unsafe scene, ownership and token configurations fail before any selection is changed", async () => {
  for (const alter of [
    f => { f.canvas.ready = false; },
    f => { f.canvas.scene.id = "other"; },
    f => { f.canvas.scene.tokenVision = false; },
    f => { f.canvas.scene.levels.size = 2; },
    f => { f.objects.get("b").actor.testUserPermission = () => false; },
    f => { f.objects.get("b").document.hidden = true; },
    f => { f.objects.get("b").document.sight.enabled = false; },
    f => { f.objects.get("b").actor.hasPlayerOwner = false; },
    f => { f.objects.delete("b"); }
  ]) {
    const fixture = canvasFixture();
    alter(fixture);
    await assert.rejects(fixture.adapter.applyShared(command()), /AVControl.View.Error/);
    assert.deepEqual(fixture.controls, []);
    assert.equal(fixture.canvas.refreshes, 0);
  }
});

test("GM controller persists requests through settings and accepts only matching client status", async () => {
  let saved = IDLE_DISPLAY_STATE;
  let writes = 0;
  let mismatch = false;
  const user = {
    id: "screen", active: true,
    query: async () => ({ revision: mismatch ? "old" : JSON.parse(saved).revision, state: "black" })
  };
  const game = {
    user: { isGM: false }, users: { get: () => user },
    settings: {
      get: (namespace, key) => key === "displayUserId" ? "screen" : saved,
      set: async (namespace, key, value) => { writes++; saved = value; }
    }
  };
  const control = new ViewControl({ game, getCanvas: () => null, refresh() {} });
  await control.command("black");
  assert.equal(writes, 0);
  game.user.isGM = true;
  await control.command("black");
  assert.equal(writes, 1);
  assert.equal(JSON.parse(saved).mode, "black");
  assert.equal(control.snapshot().resultKey, "AVControl.View.Result.black");
  mismatch = true;
  await control.check();
  assert.equal(control.snapshot().resultKey, "AVControl.View.Result.pending");
  await control.command("gm");
  assert.equal(writes, 1);
});

test("show screen restores native view without tokens or resumes the saved shared scene", async () => {
  let saved = IDLE_DISPLAY_STATE;
  const user = {
    id: "screen", active: true,
    query: async () => {
      const config = JSON.parse(saved);
      return { revision: config.revision, state: config.mode };
    }
  };
  const game = {
    user: { isGM: true }, users: { get: () => user },
    settings: {
      get: (namespace, key) => key === "displayUserId" ? "screen" : saved,
      set: async (namespace, key, value) => { saved = value; }
    }
  };
  const control = new ViewControl({ game, getCanvas: () => null, refresh() {} });
  await control.command("black");
  await control.command("resume");
  assert.equal(JSON.parse(saved).mode, "idle");
  assert.equal(control.snapshot().resultKey, "AVControl.View.Result.shown");

  saved = JSON.stringify(command());
  await control.command("black");
  assert.deepEqual(JSON.parse(saved).tokenIds, ["a", "b"]);
  await control.command("resume");
  const resumed = JSON.parse(saved);
  assert.equal(resumed.mode, "shared");
  assert.equal(resumed.sceneId, "scene");
  assert.deepEqual(resumed.tokenIds, ["a", "b"]);
  assert.equal(control.snapshot().resultKey, "AVControl.View.Result.shared");
});
