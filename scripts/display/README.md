# Display boundary

`connection.js` owns dedicated shared-screen account selection and explicit
read-only connection checks. Core injects settings, users, authorization and the
Foundry query transport. It has no Foundry globals or peer-component imports.

The saved selection identifies an account, not a physical device. Use a dedicated
non-GM account in a single browser session. There is no scene/camera control,
permission change, heartbeat, automatic probing or startup write. See
[Display testing and protocol](../../docs/DISPLAY.md).
