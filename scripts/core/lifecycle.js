import { registerSettings } from "./settings.js";
import { ControlPanel } from "../ui/control-panel.js";

/** Initialization registers the panel without changing any world documents. */
export function initialize() {
  registerSettings(game.settings, ControlPanel);
}
