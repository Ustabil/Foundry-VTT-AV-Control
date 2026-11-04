/** Strict, versioned state written through GM-only world settings, never sockets. */
export const IDLE_DISPLAY_STATE = JSON.stringify({ protocol: 1, mode: "idle", userId: "", sceneId: "", tokenIds: [], revision: "" });

export function parseDisplayState(raw) {
  const state = JSON.parse(raw);
  const id = value => typeof value === "string" && value.length <= 64;
  if (!state || state.protocol !== 1 || !["idle", "black", "shared"].includes(state.mode)
    || !id(state.userId) || !id(state.sceneId) || !id(state.revision)
    || !Array.isArray(state.tokenIds) || state.tokenIds.length > 100
    || !state.tokenIds.every(value => id(value) && value.length > 0)
    || new Set(state.tokenIds).size !== state.tokenIds.length
    || (state.mode !== "idle" && (!state.userId || !state.revision))
    || (state.mode === "shared" && (!state.sceneId || !state.tokenIds.length))) {
    throw new Error("AVControl.View.Error.InvalidState");
  }
  return state;
}

/** GM candidates must already belong to players and have enabled sight. */
export function isPartyToken(token) {
  return !!token.actor?.hasPlayerOwner && token.sight?.enabled === true && !token.hidden;
}
