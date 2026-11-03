/** Account selection and explicit connection checks. Dependencies come from Core;
 * no Foundry globals, UI imports, timers, scene changes or audio operations.
 */
export class DisplayConnection {
  #dependencies;
  #listeners = new Set();
  #generation = 0;
  #phase = "untested";
  #started = false;

  constructor(dependencies) { this.#dependencies = dependencies; }

  start() {
    this.#started = true;
    this.refresh();
  }

  subscribe(listener) {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  /** Invalidate checks when selection, connection or user data changes. */
  refresh() {
    this.#generation++;
    this.#phase = "untested";
    this.#notify();
  }

  #notify() { for (const listener of this.#listeners) listener(); }
  #eligible(user) { return !!user && !user.isGM && !user.isBanned; }

  #requireGM() {
    if (!this.#dependencies.canControl()) throw new Error("AVControl.Display.Error.Permission");
  }

  snapshot() {
    const selectedId = this.#dependencies.getSelectedId();
    const users = this.#dependencies.getUsers();
    const selected = users.find(user => user.id === selectedId);
    let status = this.#phase;
    if (!this.#started) status = "notReady";
    else if (!selectedId) status = "notSelected";
    else if (!this.#eligible(selected)) status = "unavailable";
    else if (!selected.active) status = "offline";
    return {
      selectedId,
      status,
      invalidSelection: !!selectedId && !this.#eligible(selected),
      canTest: this.#started && this.#eligible(selected) && !!selected.active && status !== "checking",
      users: users.filter(user => this.#eligible(user))
        .map(user => ({ id: user.id, name: user.name, active: !!user.active, selected: user.id === selectedId }))
        .sort((a, b) => a.name.localeCompare(b.name))
    };
  }

  async select(userId) {
    this.#requireGM();
    if (!this.#started) throw new Error("AVControl.Display.Error.NotReady");
    if (typeof userId !== "string" || (userId && !this.#dependencies.getUsers()
      .some(user => user.id === userId && this.#eligible(user)))) {
      throw new Error("AVControl.Display.Error.Selection");
    }
    await this.#dependencies.setSelectedId(userId);
    this.refresh();
  }

  async test() {
    this.#requireGM();
    const state = this.snapshot();
    if (!state.canTest) return;
    const target = this.#dependencies.getUsers().find(user => user.id === state.selectedId);
    const generation = ++this.#generation;
    this.#phase = "checking";
    this.#notify();
    let responded = false;
    try {
      responded = await this.#dependencies.probe(target) === true;
    } catch {
      // Timeout, missing handler and query permission errors all mean no
      // confirmed response; do not claim which one caused the failure.
    }
    if (generation !== this.#generation || this.#dependencies.getSelectedId() !== state.selectedId) return;
    this.#phase = responded ? "responded" : "noResponse";
    this.#notify();
  }
}
