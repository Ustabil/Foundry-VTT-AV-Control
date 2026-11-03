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
export function refreshDisplay() { display?.refresh(); }
