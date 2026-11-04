import { registerSettings } from "./settings.js";
import { ControlPanel } from "../ui/control-panel.js";
import { MODULE_ID, DISPLAY_USER_SETTING, DISPLAY_VIEW_SETTING } from "./constants.js";
import { canControl } from "./permissions.js";
import { registerPresenceQuery, probeDisplay } from "./transport.js";
import { DisplayConnection } from "../display/connection.js";
import { DisplayScreen } from "../display/screen.js";
import { createScreenAdapter } from "../display/foundry-screen.js";
import { ViewControl, DISPLAY_STATUS_QUERY } from "./view-control.js";

let display;
let screen;
let adapter;

/** Register dependencies and read-only query handler; no startup writes or probes. */
export function initialize() {
  display = new DisplayConnection({
    canControl: () => canControl(game.user),
    getUsers: () => game.users.contents,
    getSelectedId: () => game.settings.get(MODULE_ID, DISPLAY_USER_SETTING),
    setSelectedId: id => game.settings.set(MODULE_ID, DISPLAY_USER_SETTING, id),
    probe: probeDisplay
  });
  adapter = createScreenAdapter({
    getCanvas: () => globalThis.canvas,
    getUser: () => game.user,
    document: globalThis.document,
    nextFrame: () => new Promise(resolve => requestAnimationFrame(resolve))
  });
  const isTarget = () => !!game.user && !game.user.isGM && !game.user.isBanned
    && game.user.id === game.settings.get(MODULE_ID, DISPLAY_USER_SETTING);
  screen = new DisplayScreen({
    ...adapter, isTarget,
    getUserId: () => game.user?.id,
    getConfig: () => game.settings.get(MODULE_ID, DISPLAY_VIEW_SETTING)
  });
  ControlPanel.view = new ViewControl({
    game, getCanvas: () => globalThis.canvas,
    refresh: () => display.refresh({ invalidate: false })
  });
  ControlPanel.display = display;
  registerSettings(game.settings, ControlPanel, () => {
    display.refresh();
    void screen.sync();
  }, () => {
    display.refresh({ invalidate: false });
    void screen.sync();
  });
  CONFIG.queries[DISPLAY_STATUS_QUERY] = async data => {
    if (!isTarget() || !data || data.protocol !== 1 || Object.keys(data).length !== 1) return null;
    return screen.status();
  };
  registerPresenceQuery(CONFIG.queries, () => ({
    ready: game.ready,
    selected: game.user?.id === game.settings.get(MODULE_ID, DISPLAY_USER_SETTING),
    isGM: game.user?.isGM,
    isBanned: game.user?.isBanned,
    userId: game.user?.id
  }));
}

export function ready() { display.start(); void screen.sync(); }
export function syncScreen() {
  if (!adapter?.isApplying()) void screen?.sync();
  display?.refresh({ invalidate: false });
}
export function concealScreen() { screen?.conceal(); }
export function updateDisplayToken(token, changes) {
  if (Object.keys(changes).some(key => ["sight", "hidden", "actorId", "actorLink", "level"].some(field => key === field || key.startsWith(`${field}.`)))) {
    syncScreen();
  }
  display?.refresh({ invalidate: false });
}
export function updateDisplayActor(actor, changes) {
  if (Object.keys(changes).some(key => key === "ownership" || key.startsWith("ownership."))) syncScreen();
}
export function updateDisplayScene(scene, changes) {
  if (Object.keys(changes).some(key => ["tokenVision", "levels"].some(field => key === field || key.startsWith(`${field}.`)))) syncScreen();
}
/** Connections/create/delete affect the list, but only the target invalidates a test. */
export function refreshDisplay(user) {
  display?.refresh({
    invalidate: user.id === game.settings.get(MODULE_ID, DISPLAY_USER_SETTING)
  });
}

/** Routine User updates (activity, flags, character, etc.) are not connection changes. */
export function updateDisplayUser(user, changes) {
  const changed = key => Object.hasOwn(changes, key);
  if (!["name", "role", "active"].some(changed)) return;
  display?.refresh({
    invalidate: user.id === game.settings.get(MODULE_ID, DISPLAY_USER_SETTING)
      && (changed("role") || changed("active"))
  });
  syncScreen();
}
