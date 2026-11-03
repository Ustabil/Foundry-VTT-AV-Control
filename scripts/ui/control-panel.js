import { MODULE_ID } from "../core/constants.js";
import { canControl } from "../core/permissions.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/** Core injects the Display service; UI prepares context and delegates actions. */
export class ControlPanel extends HandlebarsApplicationMixin(ApplicationV2) {
  static display;
  #unsubscribe;
  #saving = false;
  #error = "";
  #renderQueue = Promise.resolve();
  #draftUserId;

  static DEFAULT_OPTIONS = {
    id: `${MODULE_ID}-panel`,
    classes: ["av-control"],
    window: { title: "AVControl.Panel.Title" },
    position: { width: 460, height: "auto" },
    actions: {
      saveDisplay: this.#saveDisplay,
      testDisplay: this.#testDisplay,
      refreshDisplay: this.#refreshDisplay
    }
  };

  static PARTS = {
    content: { template: `modules/${MODULE_ID}/templates/control-panel.hbs` }
  };

  /** Also enforce access for direct construction outside the restricted menu. */
  _canRender(options) {
    if (!canControl(game.user)) return false;
    return super._canRender(options);
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const display = this.constructor.display.snapshot();
    // Preserve an unsaved choice across connection/status refreshes.
    const chosenId = this.#draftUserId ?? display.selectedId;
    const choices = {
      ...display,
      selectedId: chosenId,
      invalidSelection: !!chosenId && !display.users.some(user => user.id === chosenId),
      users: display.users.map(user => ({ ...user, selected: user.id === chosenId }))
    };
    return {
      ...context, display: choices,
      statusKey: `AVControl.Display.Status.${display.status}`,
      saving: this.#saving,
      testDisabled: this.#saving || !display.canTest,
      error: this.#error
    };
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    this.#unsubscribe ??= this.constructor.display.subscribe(() => { void this.#refresh(); });
    this.element.querySelector('[name="displayUserId"]').addEventListener("change", event => {
      this.#draftUserId = event.currentTarget.value;
    });
  }

  _onClose(options) {
    this.#unsubscribe?.();
    this.#unsubscribe = undefined;
    this.#draftUserId = undefined;
    this.#error = "";
    return super._onClose(options);
  }

  /** Serialize status renders so a fast reply cannot be lost mid-render. */
  #refresh() {
    this.#renderQueue = this.#renderQueue.then(async () => {
      if (this.#unsubscribe && canControl(game.user)) await this.render({ force: true });
    }).catch(error => { console.error("AV Control | Panel rendering failed", error); });
    return this.#renderQueue;
  }

  /** @this {ControlPanel} */
  static async #saveDisplay() {
    if (!canControl(game.user) || this.#saving) return;
    const userId = this.element.querySelector('[name="displayUserId"]').value;
    this.#draftUserId = userId;
    this.#saving = true;
    this.#error = "";
    try {
      await this.#refresh();
      await this.constructor.display.select(userId);
      this.#draftUserId = undefined;
    } catch (error) {
      this.#error = error?.message?.startsWith("AVControl.Display.Error.")
        ? error.message : "AVControl.Display.Error.Save";
    } finally {
      this.#saving = false;
      await this.#refresh();
    }
  }

  /** @this {ControlPanel} */
  static async #testDisplay() {
    if (!canControl(game.user) || this.#saving) return;
    await this.constructor.display.test();
  }

  /** @this {ControlPanel} */
  static #refreshDisplay() {
    if (!canControl(game.user) || this.#saving) return;
    this.#error = "";
    this.constructor.display.refresh();
  }
}
