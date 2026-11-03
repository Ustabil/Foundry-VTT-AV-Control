import { MODULE_ID } from "../core/constants.js";
import { canControl } from "../core/permissions.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/** Read-only scaffold, opened through Configure Settings > AV Control. */
export class ControlPanel extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: `${MODULE_ID}-panel`,
    classes: ["av-control"],
    window: { title: "AVControl.Panel.Title" },
    position: { width: 420, height: "auto" }
  };

  static PARTS = {
    content: { template: `modules/${MODULE_ID}/templates/control-panel.hbs` }
  };

  /** Also enforce access for direct construction outside the restricted menu. */
  _canRender(options) {
    if (!canControl(game.user)) return false;
    return super._canRender(options);
  }
}
