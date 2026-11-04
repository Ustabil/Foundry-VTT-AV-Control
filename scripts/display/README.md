# Display boundary

`connection.js` owns dedicated shared-screen account selection and explicit
read-only connection checks. Core injects settings, users, authorization and the
Foundry query transport. It has no Foundry globals or peer-component imports.

`screen.js` coordinates fail-closed local screen state. `foundry-screen.js` uses
dependency-injected browser and documented V14 canvas APIs. `state.js` validates
the control state. Core supplies GM-protected settings and read-only status queries.

The saved selection identifies an account, not a physical device. Use one dedicated
non-GM browser session. No scene/camera control, permission changes, heartbeat or
startup setting writes. Native fog exploration continues normally; the module
never disables, resets or replaces it. See [screen setup](../../docs/SCREEN.md).
