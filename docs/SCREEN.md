# Black screen and shared vision — 0.3.1 test release

## Prepare an isolated world

Use a separate test world/user-data directory. Publish `v0.3.1`, install/update
from Foundry Setup and reload **both** clients. Select the normal display player
account as before. Keep that account in exactly one browser session. Do not use
the production campaign for these first vision tests.

For shared vision, place at least two player-owned actors as visible tokens with
sight enabled in a scene. Enable the scene's **Token Vision**. Both clients must
already be viewing that scene; scene switching is not implemented yet. This first
version rejects scenes with more than one level.

Manually give the dedicated display account **Owner** permission on the chosen
actors in the test world. This is Foundry's native control requirement; it also
gives the account normal actor/token control rights. The module never grants or
revokes permissions, copies user roles, changes token sight or forces control.
Do not give the screen account GM/assistant status. Checkboxes show non-hidden,
player-owned tokens with sight enabled, not enemies or GM-only tokens.

## Controls

- **Black screen** covers the entire current display-browser viewport with an
  opaque black overlay. It does not power off hardware, stop audio or change the
  GM/other players' views. The setting persists across display reloads/offline use.
  It retains the last saved shared-token choice for the same account, so it can
  be reapplied when showing the map again.
- Check the tokens to include and use **Apply shared vision / Show screen** to
  remove the cover after native vision is ready. At least one token is required.
  It controls exactly that set locally, without moving tokens or panning.
- **Show screen** removes blackout without requiring a new token selection. It
  resumes the last saved shared tokens and scene, or restores normal player view
  if shared vision was never configured. A failed shared resume stays black; it
  never falls back to native view when a shared configuration exists.
- **Check screen status** asks the display for the outcome of the saved command.
  Only a response matching the request revision counts as confirmation. A timeout
  means unconfirmed, not necessarily unapplied; the request may already be saved.

There is no GM reveal mode. **Show screen** returns to player vision. Clearing the display-account setting stops the
module's local management and restores the previous local token selection where
possible. Initial idle mode preserves native Foundry behavior until a GM sends
the first command. After a managed request, invalid configuration keeps the
display black; GM can correct it and apply again.

Commands are saved in `av-control.displayView`, a versioned JSON string world
setting. Foundry's world-setting write permissions are the control authority.
`av-control.displayStatus` is a read-only targeted query; it cannot execute commands
and accepts no sender ID. No unauthenticated broadcast command listener is used.

## Fog behavior and limits

Shared vision uses native `Token.control` for the checked tokens, retaining their
normal walls, light, sight modes and detection rules. The module does not change
fog settings, remove exploration, reveal hidden tokens, construct custom vision
sources, impersonate another player or include GM exploration.

**Existing explored fog on the display account remains visible according to the
scene's normal fog mode.** Foundry also records exploration normally while that
account is using shared vision; with native shared fog, it participates in that
shared history. Unchecking a token does not erase previously explored history.
This is shared player vision, not a fog-history-isolated copy of one player's view.
Use a fresh display account in the test world to verify the initial behavior.

The black cover is applied before selecting tokens, held across two browser
animation frames, and retained on errors. Scene teardown hides managed content
until the requested scene is ready again. Unexpected local selection changes
reapply the saved selection behind the cover. Ownership/vision configuration is
rechecked on relevant document updates. Native movement/lighting updates continue
without reapplying the whole selection for each movement step.

The overlay covers this browser viewport. Separate OS windows, browser UI and
already detached Foundry windows are outside its scope; use one normal browser
window for the dedicated display.

## Mandatory manual tests — not yet performed

Record Foundry build, game system/version, browser and fog mode. Automated tests
cannot establish PIXI rendering, true union vision or absence of a visual flash.

1. Update from 0.2.1 through Setup and reload both clients. Confirm initial idle
   does not alter their views; GM/player permissions and presence still work.
2. Click **Black screen**. Verify the **display** is entirely black and GM/other
   players are unaffected. Confirm the GM sees an acknowledged black result.
3. Reload the display while black; verify it stays black during canvas loading.
   Disconnect it, save black from GM, reconnect and verify it applies the request.
4. On a walled, partially lit test map, put two player tokens in separate rooms.
   With Owner access configured, select both and apply shared vision. Confirm the
   display shows their combined legitimate vision, neither hidden rooms nor GM
   exploration. Verify different darkvision/detection capabilities explicitly.
5. Uncheck one and reapply. Confirm current sight comes from the remaining token.
   Previously explored fog may remain as described above. No token moves or
   camera panning should occur; GM and other players keep their selections.
6. Repeat with no tokens, missing permissions, a hidden/deleted token, disabled
   token sight, Token Vision off, another scene and multiple scene levels. Each
   received unsafe request must remain black with a useful status, never DM view.
7. Revoke ownership or hide/delete a selected token while shared mode is active.
   Confirm it becomes black before a changed frame can reveal information. Restore
   configuration and apply shared vision again.
8. Change scenes on the display while shared mode is active. Confirm black during
   loading and black on the wrong scene. Return to the requested scene; confirm
   native selection is reapplied. Inspect transition frames for flashes.
9. Start shared apply and immediately request black from another GM. Confirm a
   late shared completion cannot unmask the newer black request. Check status on
   both GM clients; status acknowledgements are historical until checked again.
10. Try local token selection/deselection on the display. Confirm the module
    restores the checked set under cover. Do not move tokens from that client.
11. In individual and shared fog modes, compare explored regions before/after
    selection changes. Confirm only normal player exploration is added and no GM
    exploration is copied. Do not reset fog as part of this test.
12. Test offline status, delayed settings propagation and missing status handlers.
    A missing/mismatched acknowledgement must never be displayed as success.
13. Before configuring shared tokens, test **Black screen > Show screen**. Confirm
    normal player view returns without selecting a token or changing accounts.
    Then repeat after configuring shared tokens; confirm their saved selection is
    restored, including if the GM has since viewed a different scene. A display
    on the wrong scene or with revoked access must remain black.

## Planned next steps

- Follow one player's token vision, with fog-history semantics tested separately.
- Follow camera: debounce movement by **2500 ms**, resetting the timer on every
  movement so the camera moves once after the player has stopped stepping.
- Scene list for atmosphere, return to the prior game view, and fit-to-screen.
- No DM view is implemented. Any future exceptional GM-reveal mode requires a
  separate design with deliberate activation and persistent warning.

## Documented V14 APIs

- [Token.control](https://foundryvtt.com/api/v14/classes/foundry.canvas.placeables.Token.html#control)
- [TokenLayer.releaseAll](https://foundryvtt.com/api/v14/classes/foundry.canvas.layers.TokenLayer.html#releaseAll)
- [PerceptionManager.initialize](https://foundryvtt.com/api/v14/classes/foundry.canvas.perception.PerceptionManager.html#initialize)
- [Native token vision](https://foundryvtt.com/article/tokens/)
- [ClientSettings](https://foundryvtt.com/api/v14/classes/foundry.helpers.ClientSettings.html)
