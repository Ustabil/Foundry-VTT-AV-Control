import { MODULE_ID, DISPLAY_USER_SETTING, DISPLAY_VIEW_SETTING } from "./constants.js";
import { IDLE_DISPLAY_STATE } from "../display/state.js";

/** Selection is a world setting; only an explicit GM save persists it. */
export function registerSettings(settings, ControlPanel, onDisplayChange, onViewChange) {
  settings.register(MODULE_ID, DISPLAY_VIEW_SETTING, {
    name: "AVControl.View.Title",
    hint: "AVControl.View.Hint",
    scope: "world", config: false,
    type: new foundry.data.fields.StringField({ required: true, nullable: false }),
    default: IDLE_DISPLAY_STATE,
    onChange: onViewChange
  });
  settings.register(MODULE_ID, DISPLAY_USER_SETTING, {
    name: "AVControl.Display.User",
    hint: "AVControl.Display.Hint",
    scope: "world",
    config: false,
    type: new foundry.data.fields.StringField({ required: true, nullable: false }),
    default: "",
    onChange: onDisplayChange
  });
  settings.registerMenu(MODULE_ID, "controlPanel", {
    name: "AVControl.Panel.Title",
    label: "AVControl.Panel.Open",
    hint: "AVControl.Panel.Hint",
    icon: "fa-solid fa-sliders",
    type: ControlPanel,
    restricted: true
  });
}
