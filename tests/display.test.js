import test from "node:test";
import assert from "node:assert/strict";
import { DisplayConnection } from "../scripts/display/connection.js";
import { DISPLAY_PROBE, PROBE_TIMEOUT_MS, probeDisplay, registerPresenceQuery } from "../scripts/core/transport.js";

function fixture() {
  const state = {
    gm: true, selected: "", writes: [], probes: [],
    users: [
      { id: "gm", name: "GM", isGM: true, active: true },
      { id: "screen", name: "Screen", isGM: false, active: true },
      { id: "other", name: "Other player", isGM: false, active: false },
      { id: "banned", name: "Banned", isBanned: true }
    ],
    reply: async () => true
  };
  const display = new DisplayConnection({
    canControl: () => state.gm,
    getUsers: () => state.users,
    getSelectedId: () => state.selected,
    setSelectedId: async id => { state.writes.push(id); state.selected = id; },
    probe: async user => { state.probes.push(user.id); return state.reply(); }
  });
  return { display, state };
}

test("selection is opt-in, persistent only on explicit save, and restricted to eligible accounts", async () => {
  const { display, state } = fixture();
  assert.equal(display.snapshot().status, "notReady");
  await assert.rejects(display.select("screen"), /NotReady/);
  display.start();
  assert.equal(display.snapshot().status, "notSelected");
  assert.deepEqual(state.writes, []);
  assert.deepEqual(state.probes, []);
  assert.deepEqual(display.snapshot().users.map(u => u.id), ["other", "screen"]);
  for (const id of ["gm", "banned", "missing", null, {}]) {
    await assert.rejects(display.select(id), /Selection/);
  }
  await display.select("screen");
  assert.equal(display.snapshot().status, "untested");
  assert.deepEqual(state.writes, ["screen"]);
  await display.test();
  assert.equal(display.snapshot().status, "responded");
  assert.deepEqual(state.probes, ["screen"]);
  state.gm = false;
  await assert.rejects(display.select(""), /Permission/);
  await assert.rejects(display.test(), /Permission/);
  state.gm = true;
  await display.select("");
  assert.equal(display.snapshot().status, "notSelected");
});

test("offline, deleted and promoted accounts are never probed", async () => {
  const { display, state } = fixture();
  display.start();
  state.selected = "other";
  assert.equal(display.snapshot().status, "offline");
  await display.test();
  state.selected = "missing";
  assert.equal(display.snapshot().status, "unavailable");
  assert.equal(display.snapshot().invalidSelection, true);
  await display.test();
  state.selected = "gm";
  assert.equal(display.snapshot().status, "unavailable");
  await display.test();
  assert.deepEqual(state.probes, []);
});

test("disconnects and selection changes invalidate in-flight replies; duplicate tests are suppressed", async () => {
  const { display, state } = fixture();
  display.start();
  await display.select("screen");
  let resolve;
  state.reply = () => new Promise(done => { resolve = done; });
  const pending = display.test();
  assert.equal(display.snapshot().status, "checking");
  await display.test();
  assert.equal(state.probes.length, 1);
  await display.select("other");
  resolve(true);
  await pending;
  assert.equal(display.snapshot().status, "offline");
  await display.select("screen");
  const disconnected = display.test();
  state.users.find(user => user.id === "screen").active = false;
  display.refresh();
  resolve(true);
  await disconnected;
  assert.equal(display.snapshot().status, "offline");
  state.users.find(user => user.id === "screen").active = true;
  display.refresh();
  assert.equal(display.snapshot().status, "untested");
});

test("failures permit retry and subscriptions can be removed", async () => {
  const { display, state } = fixture();
  display.start();
  await display.select("screen");
  let changes = 0;
  const unsubscribe = display.subscribe(() => changes++);
  state.reply = async () => { throw new Error("timeout"); };
  await display.test();
  assert.equal(display.snapshot().status, "noResponse");
  assert.equal(changes, 2);
  unsubscribe();
  state.reply = async () => true;
  await display.test();
  assert.equal(display.snapshot().status, "responded");
  assert.equal(changes, 2);
});

test("list-only refreshes preserve a pending test and its completed result", async () => {
  const { display, state } = fixture();
  display.start();
  await display.select("screen");
  let resolve;
  state.reply = () => new Promise(done => { resolve = done; });
  const pending = display.test();
  display.refresh({ invalidate: false });
  assert.equal(display.snapshot().status, "checking");
  resolve(true);
  await pending;
  display.refresh({ invalidate: false });
  assert.equal(display.snapshot().status, "responded");
  display.refresh();
  assert.equal(display.snapshot().status, "untested");
});

test("presence endpoint accepts only its read-only protocol on the selected ready non-GM client", async () => {
  const queries = {};
  let presence = { ready: true, selected: true, isGM: false, userId: "screen" };
  registerPresenceQuery(queries, () => presence);
  const handler = queries[DISPLAY_PROBE];
  for (const data of [undefined, null, [], "ping", {}, { protocol: 2 }, { protocol: 1, command: "viewScene" }]) {
    assert.equal(await handler(data), null);
  }
  assert.deepEqual(await handler({ protocol: 1 }), { protocol: 1, userId: "screen" });
  for (const patch of [{ ready: false }, { selected: false }, { isGM: true }, { isBanned: true }]) {
    const previous = presence;
    presence = { ...presence, ...patch };
    assert.equal(await handler({ protocol: 1 }), null);
    presence = previous;
  }
});

test("transport targets the User with a bounded timeout and rejects mismatched responses", async () => {
  let response = { protocol: 1, userId: "screen" };
  const calls = [];
  const user = { id: "screen", query: async (...args) => { calls.push(args); return response; } };
  assert.equal(await probeDisplay(user), true);
  assert.deepEqual(calls[0], [DISPLAY_PROBE, { protocol: 1 }, { timeout: PROBE_TIMEOUT_MS }]);
  assert.equal(PROBE_TIMEOUT_MS, 5000);
  for (response of [null, {}, { protocol: 2, userId: "screen" }, { protocol: 1, userId: "other" }]) {
    assert.equal(await probeDisplay(user), false);
  }
});
