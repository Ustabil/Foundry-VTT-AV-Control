import { isPartyToken } from "./state.js";

/** Public V14 canvas calls only. Never grants ownership or changes fog settings. */
export function createScreenAdapter({ getCanvas, getUser, document, nextFrame }) {
  let cover;
  let previous;
  let applying = false;
  const fail = key => { throw new Error(`AVControl.View.Error.${key}`); };

  function setCover(black) {
    if (!black) { cover?.remove(); cover = undefined; return; }
    if (cover) return;
    cover = document.createElement("div");
    cover.id = "av-control-blackout";
    // Inline opaque styling also protects during startup before theme CSS settles.
    cover.style.cssText = "position:fixed;inset:0;background:#000;z-index:2147483647;pointer-events:auto;touch-action:none;";
    cover.setAttribute("aria-label", "AV Control");
    document.body.append(cover);
  }

  function restore() {
    const canvas = getCanvas();
    if (!previous || !canvas?.ready || canvas.scene.id !== previous.sceneId) { previous = undefined; return; }
    applying = true;
    try {
      canvas.tokens.releaseAll();
      for (const id of previous.ids) canvas.tokens.get(id)?.control({ releaseOthers: false, pan: false });
      canvas.perception.initialize();
    } finally { previous = undefined; applying = false; }
  }

  async function applyShared(config) {
    const canvas = getCanvas();
    if (!canvas?.ready || canvas.scene?.id !== config.sceneId) fail("Scene");
    if (!canvas.scene.tokenVision) fail("Vision");
    if (canvas.scene.levels.size > 1) fail("Levels");
    const tokens = config.tokenIds.map(id => canvas.tokens.get(id));
    if (tokens.some(token => !token || !isPartyToken(token.document))) fail("Tokens");
    if (tokens.some(token => !token.actor.testUserPermission(getUser(), "OWNER"))) fail("Ownership");
    if (!previous || previous.sceneId !== canvas.scene.id) {
      previous = { sceneId: canvas.scene.id, ids: canvas.tokens.controlled.map(token => token.id) };
    }
    applying = true;
    try {
      canvas.tokens.activate();
      canvas.tokens.releaseAll();
      for (const token of tokens) {
        if (!token.control({ releaseOthers: false, pan: false })) fail("Ownership");
      }
      const controlled = canvas.tokens.controlled;
      if (controlled.length !== tokens.length || controlled.some(token => !config.tokenIds.includes(token.id))) fail("Tokens");
      canvas.perception.initialize();
    } finally { applying = false; }
    // Keep the opaque cover through rendering, not merely through control calls.
    await nextFrame();
    await nextFrame();
  }

  return { cover: setCover, restore, applyShared, isApplying: () => applying };
}
