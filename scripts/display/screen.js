import { parseDisplayState } from "./state.js";

/** Local display only. World settings supply authority, not query payloads. */
export class DisplayScreen {
  #dependencies;
  #generation = 0;
  #pending = Promise.resolve();
  #status = { state: "idle", revision: "", error: "" };

  constructor(dependencies) { this.#dependencies = dependencies; }

  sync() {
    const generation = ++this.#generation;
    const deps = this.#dependencies;
    if (!deps.isTarget()) {
      deps.restore();
      deps.cover(false);
      this.#status = { state: "idle", revision: "", error: "" };
      this.#pending = Promise.resolve();
      return this.#pending;
    }
    // Hide the canvas before reading/applying any requested state.
    deps.cover(true);
    this.#pending = (async () => {
      let revision = "";
      try {
        const config = parseDisplayState(deps.getConfig());
        revision = config.revision;
        if (config.userId !== deps.getUserId() || config.mode === "idle") {
          deps.restore();
          deps.cover(false);
          this.#status = { state: "idle", revision, error: "" };
          return;
        }
        this.#status = { state: "applying", revision, error: "" };
        if (config.mode === "shared") await deps.applyShared(config);
        if (generation !== this.#generation) return;
        this.#status = { state: config.mode, revision, error: "" };
        deps.cover(config.mode === "black");
      } catch (error) {
        if (generation !== this.#generation) return;
        this.#status = {
          state: "error", revision,
          error: error?.message?.startsWith("AVControl.View.Error.") ? error.message : "AVControl.View.Error.Apply"
        };
        deps.cover(true);
      }
    })();
    return this.#pending;
  }

  /** Cover before scene teardown or unexpected token selection changes. */
  conceal() {
    if (this.#dependencies.isTarget() && this.#status.state !== "idle") {
      this.#generation++;
      this.#dependencies.cover(true);
      this.#status = { ...this.#status, state: "applying" };
    }
  }

  async status() {
    await this.#pending;
    return { ...this.#status };
  }
}
