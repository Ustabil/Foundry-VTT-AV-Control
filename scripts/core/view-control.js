import { MODULE_ID, DISPLAY_USER_SETTING, DISPLAY_VIEW_SETTING } from "./constants.js";
import { canControl } from "./permissions.js";
import { isPartyToken, parseDisplayState } from "../display/state.js";

export const DISPLAY_STATUS_QUERY = `${MODULE_ID}.displayStatus`;

/** Server-enforced GM world-setting writes are the sole control channel. */
export class ViewControl {
  #game;
  #getCanvas;
  #refresh;
  #result = "AVControl.View.Result.idle";
  #busy = false;

  constructor({ game, getCanvas, refresh }) {
    this.#game = game;
    this.#getCanvas = getCanvas;
    this.#refresh = refresh;
  }

  snapshot() {
    const canvas = this.#getCanvas();
    let config;
    try { config = parseDisplayState(this.#game.settings.get(MODULE_ID, DISPLAY_VIEW_SETTING)); } catch { /* Report during apply. */ }
    const scene = canvas?.ready ? canvas.scene : null;
    return {
      sceneId: scene?.id ?? "", sceneName: scene?.name ?? "",
      resultKey: this.#result, busy: this.#busy,
      tokens: scene ? scene.tokens.contents.filter(isPartyToken).map(token => ({
        id: token.id, name: token.name,
        checked: config?.sceneId === scene.id && config.tokenIds.includes(token.id)
      })) : []
    };
  }

  async command(mode, tokenIds = []) {
    if (!canControl(this.#game.user)) return;
    if (this.#busy) return;
    this.#busy = true;
    this.#result = "AVControl.View.Result.sending";
    this.#refresh();
    try {
      const userId = this.#game.settings.get(MODULE_ID, DISPLAY_USER_SETTING);
      const user = this.#game.users.get(userId);
      if (!user || user.isGM || user.isBanned) throw new Error("AVControl.View.Error.Account");
      const canvas = this.#getCanvas();
      let previous;
      try {
        previous = parseDisplayState(this.#game.settings.get(MODULE_ID, DISPLAY_VIEW_SETTING));
      } catch { /* A blackout can replace malformed state. */ }
      const sameUser = previous?.userId === userId;
      const resuming = mode === "resume";
      if (resuming) {
        if (!sameUser) throw new Error("AVControl.View.Error.InvalidState");
        mode = previous.tokenIds.length ? "shared" : "idle";
        tokenIds = previous.tokenIds;
      }
      const config = {
        protocol: 1, mode, userId, revision: crypto.randomUUID(),
        sceneId: resuming ? previous.sceneId : (mode === "shared" ? (canvas?.ready ? canvas.scene.id : "") : (sameUser ? previous.sceneId : "")),
        tokenIds: mode === "shared" ? tokenIds : (sameUser ? previous.tokenIds : [])
      };
      parseDisplayState(JSON.stringify(config));
      if (mode === "shared" && !resuming && tokenIds.some(id => !this.snapshot().tokens.some(token => token.id === id))) {
        throw new Error("AVControl.View.Error.Tokens");
      }
      await this.#game.settings.set(MODULE_ID, DISPLAY_VIEW_SETTING, JSON.stringify(config));
      this.#result = user.active ? await this.#readStatus(user, config.revision) : "AVControl.View.Result.savedOffline";
    } catch (error) {
      this.#result = error?.message?.startsWith("AVControl.View.Error.") ? error.message : "AVControl.View.Error.Send";
    } finally { this.#busy = false; this.#refresh(); }
  }

  async check() {
    if (!canControl(this.#game.user) || this.#busy) return;
    this.#busy = true;
    this.#refresh();
    try {
      const config = parseDisplayState(this.#game.settings.get(MODULE_ID, DISPLAY_VIEW_SETTING));
      const userId = this.#game.settings.get(MODULE_ID, DISPLAY_USER_SETTING);
      const user = this.#game.users.get(userId);
      if (!user?.active || user.isGM || config.userId !== userId) throw new Error("AVControl.View.Error.Account");
      this.#result = await this.#readStatus(user, config.revision);
    } catch { this.#result = "AVControl.View.Error.Send"; }
    finally { this.#busy = false; this.#refresh(); }
  }

  async #readStatus(user, revision) {
    const reply = await user.query(DISPLAY_STATUS_QUERY, { protocol: 1 }, { timeout: 5000 });
    if (reply?.revision !== revision) return "AVControl.View.Result.pending";
    if (reply.state === "error") {
      const allowed = ["Scene", "Vision", "Levels", "Tokens", "Ownership", "Apply", "InvalidState"].map(key => `AVControl.View.Error.${key}`);
      return allowed.includes(reply.error) ? reply.error : "AVControl.View.Error.Apply";
    }
    return ({ black: "AVControl.View.Result.black", shared: "AVControl.View.Result.shared", idle: "AVControl.View.Result.shown" })[reply.state]
      ?? "AVControl.View.Result.pending";
  }
}
