# Development

## Local checks

Use Node.js 22 or newer. There are no dependencies to install and no build step.

```sh
npm run check
```

This checks JavaScript syntax, manifest basics and version consistency, referenced
resources, template localization, lifecycle registration and GM authorization.
Tests use small API doubles, not a Foundry runtime or a full manifest schema
validator. They cannot verify browser rendering, styling or Foundry integration.

## Architecture

- `scripts/main.js`: composition root and lifecycle hooks.
- `scripts/core`: lifecycle/event coordination, world setting, permission policy
  and the read-only Foundry query transport.
- `scripts/ui`: GM-facing ApplicationV2 panel; Core injects the Display service.
- `scripts/display`: account selection and connection-test state, with injected
  dependencies and no Foundry globals or UI/Audio/Encounter imports.
- `scripts/audio`, `scripts/encounter`: documented boundaries, no behavior yet.
- `templates`, `styles`, `lang`: panel presentation and localized text.

Future controllers should receive dependencies from Core. Encounter emits semantic
events; Core routes them to explicit Display/Audio commands. Avoid peer imports
and implicit work during module import. Add transport only with concrete commands,
validated payloads and an explicit authority model. UI access checks alone do not
authorize network actions.

## Isolated Foundry installation

1. Configure a separate Foundry V14 test installation/user-data directory. Do not
   point it at the production campaign's user data.
2. Install the released module through Foundry Setup using the manifest URL and
   steps in [RELEASING.md](RELEASING.md). The Foundry server downloads it directly;
   no file copy from the development PC is required.
3. Create a disposable world with a V14-compatible game system. Enable AV Control
   only in that test world, and reload clients after code changes.
4. Do not copy production world databases, modify their settings or enable the
   scaffold there. No deployment or world-editing automation is included.

## Release packaging

See [RELEASING.md](RELEASING.md) for the GUI release process. For local packaging
verification, install the `zip` and `unzip` utilities and run:

```sh
npm run check
npm run package -- v0.3.0
```

Use the tag matching the current version. Packaging verifies the archive contents
and confirms its embedded manifest is identical to `dist/module.json`. `dist/`
is ignored by Git. The workflow runs these same commands on Ubuntu. There are
no npm dependencies or credentials needed for local validation.

## Recorded manual results

On 2026-11-03, the user reported testing the 0.1.0 scaffold with Foundry
**14.369** and DnD **6.0.6**:

- Installation through the manifest URL and module activation succeeded.
- The GM panel checks completed without reported errors.
- The panel was not available to a normal player.

This established `compatibility.verified` as `14.369` for the scaffold. Version
0.2.0 changes runtime behavior and must be tested again before restoring that
declaration. Already published assets are unchanged. Browser, theme and test-world
isolation were not recorded. The remaining
checks below, including direct-import render denial, assistant GM behavior,
multi-client side effects and disabling the module, have not been confirmed.
Updating through Setup also remains untested until a newer release is available.

## Foundry smoke checklist (manual; partially completed above)

- Record Foundry build, game system/version, browser and results.
- Confirm the module is recognized and can be enabled without manifest errors.
- Log in as GM. Open Game Settings > Configure Settings > AV Control, then
  **Open Control Panel**. Confirm the title and initialization text are localized,
  the panel is readable in supported themes, and the console has no module errors.
- Close and reopen the panel, then reload. Confirm it still works without extra
  entries or errors. Initialization should not open a panel automatically.
- Log in separately as a normal player and as an assistant GM. Confirm normal
  players cannot use the menu; assistant GMs follow Foundry's `user.isGM` policy.
- As a normal player, test the direct render guard in the browser console:

  ```js
  const { ControlPanel } = await import("/modules/av-control/scripts/ui/control-panel.js");
  await new ControlPanel().render({ force: true });
  ```

  Confirm no AV Control panel opens.
- With a second player client connected, open/close the GM panel. Confirm no
  scenes, playlists, combat state or shared-screen views change. Opening/closing
  the panel must not emit presence queries; only **Test connection** sends one.
- Disable the module in the disposable world and reload; confirm normal startup.

After a successful smoke test, record the result and set manifest `compatibility.verified`
to that tested V14 build. Repeat appropriate checks before any release.

For the new feature, complete [the 0.2.0 Display checklist](DISPLAY.md) as well.
Version 0.3.0 also requires [the screen/fog checklist](SCREEN.md). The screen state
is a second world setting; only explicit GM commands write it. Reloading the
designated display reapplies the saved mode locally without writing settings.

## API references

- [V14 ApplicationV2](https://foundryvtt.com/api/v14/classes/foundry.applications.api.ApplicationV2.html)
- [V14 HandlebarsApplicationMixin](https://foundryvtt.com/api/v14/functions/foundry.applications.api.HandlebarsApplicationMixin.html)
- [V14 ClientSettings.registerMenu](https://foundryvtt.com/api/v14/classes/foundry.helpers.ClientSettings.html#registerMenu)
- [V14 User.query](https://foundryvtt.com/api/v14/classes/foundry.documents.User.html#query)
- [V14 CONFIG.queries](https://foundryvtt.com/api/v14/variables/CONFIG.queries.html)
- [Module manifest and development](https://foundryvtt.com/article/module-development/)
