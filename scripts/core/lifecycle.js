import { registerSettings } from "./settings.js";
import { ControlPanel } from "../ui/control-panel.js";
import { MODULE_ID, DISPLAY_USER_SETTING } from "./constants.js";
import { canControl } from "./permissions.js";
import { registerPresenceQuery, probeDisplay } from "./transport.js";
import { DisplayConnection } from "../display/connection.js";

let display;

/** Register dependencies and read-only query handler; no startup writes or probes. */
export function initialize() {
  display = new DisplayConnection({
    canControl: () => canControl(game.user),
    getUsers: () => game.users.contents,
    getSelectedId: () => game.settings.get(MODULE_ID, DISPLAY_USER_SETTING),
    setSelectedId: id => game.settings.set(MODULE_ID, DISPLAY_USER_SETTING, id),
    probe: probeDisplay
  });
  ControlPanel.display = display;
  registerSettings(game.settings, ControlPanel, () => display.refresh());
  registerPresenceQuery(CONFIG.queries, () => ({
    ready: game.ready,
    selected: game.user?.id === game.settings.get(MODULE_ID, DISPLAY_USER_SETTING),
    isGM: game.user?.isGM,
    isBanned: game.user?.isBanned,
    userId: game.user?.id
  }));
}

export function ready() { display.start(); }
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
}
