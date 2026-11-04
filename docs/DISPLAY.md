# Shared display connection (0.2.0)

## Setup

1. In a disposable test world, create a dedicated normal player account such as
   **Shared Screen**. Use that account only for the shared-screen browser.
2. After installing/updating to 0.2.0 through Foundry Setup, reload all clients so
   both GM and display have the new query handler.
3. As GM, open **Configure Settings > AV Control > Open Control Panel**.
4. Choose the player account and click **Save display account**. The default is
   no account. Offline accounts can be selected; GM and banned accounts cannot.
5. Log the selected account into Foundry on the shared screen. It needs no access
   to the GM panel. Click **Test connection** on the GM client.
6. A successful test reports that the selected display client responded. **Refresh
   status** resets the previous result and refreshes account information; it does
   not send a query. Choose the empty option and save to clear the configuration.

The status and connection test refer to the **saved account**, even if the dropdown
has an unsaved choice. Online status comes from Foundry's User data; it does not
prove AV Control is loaded. A successful response describes the last explicit
test, not continuous monitoring. Success has a green checkmark and a **Connection
confirmed** heading; failures have a distinct marker and heading. Results stay
visible until a new test, explicit refresh, saved selection change or a connection/
role change of the selected account. Renames, unrelated User updates and other
players joining/leaving do not erase the result.
There is no background heartbeat or automatic probing.

Selection is account-based. Multiple tabs or devices logged in as that account
cannot be distinguished by this feature. Use one dedicated account in one browser
session; the module does not force logins, change roles or grant scene visibility.

## State and transport

Core registers `av-control.displayPresence` in `CONFIG.queries` during `init`.
It uses the documented V14 `User.query` API, which runs over Foundry's sockets.
No custom broadcast socket namespace or `socket: true` manifest flag is needed.

The GM sends `{ "protocol": 1 }` to the selected active User with a 5000 ms
timeout. Only the selected, ready, non-GM client responds with
`{ "protocol": 1, "userId": "<local-user-id>" }`. Other payloads are rejected.
The response must match the protocol and queried User. Missing handlers, invalid
responses, timeouts and query permission failures produce **No valid response**.
Disconnects and configuration changes invalidate pending results. Duplicate
tests on the same GM client are suppressed while a request is pending.

The endpoint is read-only and safe for any user to query. It neither trusts a
claimed sender ID nor executes commands. It is not an authentication mechanism
and must not be reused as authority for future scene/camera or document writes.
Future privileged commands require their own authorization design.

Only an explicit GM save writes `av-control.displayUserId`, a world-scoped module
setting. Initialization, opening the panel and probing never write settings or
campaign documents. Foundry enforces setting persistence; the UI and Display
service additionally reject non-GM actions. Deleting, banning or promoting the
selected account makes it unavailable until GM chooses another or clears it.

## Manual Foundry checklist — not yet performed for 0.2.0

Record build, system/version and browser. Test separately from production.

1. Publish 0.2.0, update from 0.1.0 using Setup's **Update** action, confirm the
   version and reload GM/display clients. Confirm no selection is made by default.
2. Open, close and reopen the GM panel. Confirm no errors and no outgoing presence
   requests until clicking **Test connection**. Confirm normal players cannot open
   the panel or change the world setting.
3. Verify the list includes offline/online non-GM accounts and excludes GMs and
   banned accounts. Save a selection, reload and confirm it persists.
4. With the selected account offline, confirm the status and disabled test button.
   Log it in: confirm online/untested, then test and confirm a successful response.
5. Keep a second ordinary player connected. Confirm it is unaffected by testing.
   Check that scenes, camera, audio, permissions and combat never change.
6. Disconnect the display during a test. Confirm it becomes offline and a late
   reply cannot restore success. Reconnect and test again. Click the test button
   rapidly and confirm no duplicate request while pending.
7. Switch saved account during a pending test (using a second GM panel/client).
   Confirm the old reply cannot mark the new account as responding. Confirm an
   unsaved dropdown choice is preserved across status refreshes.
8. Test a missing handler using a fresh display session whose console runs:

   ```js
   delete CONFIG.queries["av-control.displayPresence"];
   ```

   Confirm the GM sees no valid response rather than success or a permanently
   disabled button. Reload the display to restore its handler and retry.
9. Rename, delete, ban or promote the selected account. Confirm the list/status
   updates and an unavailable selection can be replaced or cleared.
10. Clear and save the selection. Confirm no client responds as the selected
    display. Close/reopen panels repeatedly; confirm each test still runs once.
11. Check any customized user query permissions if testing fails despite an online
    account. Inspect both browser consoles; no response is not proof of logout.

### 0.2.1 visual feedback checks (manual, not yet performed)

- Run a fast successful test and confirm the green checkmark and **Connection
  confirmed** remain readable after the transient testing message disappears.
- Check the success and failure boxes in both Foundry themes. Meaning must remain
  clear from their icon, heading and text without relying on color.
- Change a player's assigned character or flags, rename the display account, and
  connect/disconnect a different account. Confirm success remains visible.
- Disconnect/reconnect the selected account or change its role. Confirm the old
  success is cleared. **Refresh status** and saving a selection also clear it.

Automated checks cover the dependency-injected state machine, stale results,
permission guards, transport payload/response validation and UI delegation. They
cannot establish real Foundry query routing, browser rendering or multi-client
behavior; those require the checks above.

## References

- [V14 User.query](https://foundryvtt.com/api/v14/classes/foundry.documents.User.html#query)
- [V14 query registration](https://foundryvtt.com/api/v14/variables/CONFIG.queries.html)
- [V14 settings registration](https://foundryvtt.com/api/v14/classes/foundry.helpers.ClientSettings.html#register)
