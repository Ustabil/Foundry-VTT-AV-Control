import { MODULE_ID } from "./constants.js";

export const DISPLAY_PROBE = `${MODULE_ID}.displayPresence`;
export const PROBE_TIMEOUT_MS = 5000;

/** Read-only liveness over Foundry's managed query/socket API. No command is
 * executed and no sender identity is accepted from the payload. This endpoint
 * is safe for any user to query. Presence is not authorization: future privileged
 * commands require a separate authorization design.
 */
export function registerPresenceQuery(queries, getPresence) {
  queries[DISPLAY_PROBE] = async data => {
    if (!data || typeof data !== "object" || Array.isArray(data)
      || data.protocol !== 1 || Object.keys(data).length !== 1) return null;
    const presence = getPresence();
    if (!presence.ready || !presence.selected || presence.isGM || presence.isBanned) return null;
    return { protocol: 1, userId: presence.userId };
  };
}

export async function probeDisplay(user) {
  const response = await user.query(DISPLAY_PROBE, { protocol: 1 }, { timeout: PROBE_TIMEOUT_MS });
  return response?.protocol === 1 && response.userId === user.id;
}
