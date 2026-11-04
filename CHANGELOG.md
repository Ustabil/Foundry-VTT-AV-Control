# Changelog

## 0.2.1 — prepared, not yet published

- Show connection results in a persistent status box with a green checkmark and
  a clear success heading, or a distinct failure marker and heading.
- Preserve results across unrelated User updates, renames and other players'
  connections; invalidate them on selected-account connection/role changes,
  selection saves, explicit refresh or a new test.

## 0.2.0

- Select and save a dedicated non-GM display account from the GM panel.
- Check its online status and manually test its AV Control connection through
  Foundry's managed socket queries, with a five-second timeout.
- Reject invalid targets and payloads; invalidate stale results on account or
  connection changes. No scene, camera, Audio or Encounter automation is included.
- Requires a new manual Foundry smoke test; 0.1.0 test results remain documented.
- User subsequently reported successful account selection, online status and a
  successful connection test. Full multi-client checklist remains incomplete.

## 0.1.0

- Initial modular scaffold, restricted GM panel and GitHub Releases distribution.
- User tested installation, activation, panel and normal-player access denial on
  Foundry 14.369 with DnD 6.0.6.
