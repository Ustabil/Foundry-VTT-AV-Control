import { MODULE_ID } from "./constants.js";

/** Register UI entry points only; no persistent settings are needed yet. */
export function registerSettings(settings, ControlPanel) {
  settings.registerMenu(MODULE_ID, "controlPanel", {
    name: "AVControl.Panel.Title",
    label: "AVControl.Panel.Open",
    hint: "AVControl.Panel.Hint",
    icon: "fa-solid fa-sliders",
    type: ControlPanel,
    restricted: true
  });
}
