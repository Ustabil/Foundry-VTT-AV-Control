# Project conventions

- Target Foundry VTT V14, JavaScript ES modules, and documented V14 APIs.
- Keep the module ID `av-control` consistent across paths and manifest resources.
- `scripts/main.js` owns lifecycle hook registration. Core coordinates settings,
  permission policy, future events and socket transport. UI renders controls.
- Display, Audio and Encounter remain independent; inject dependencies from Core.
  Display supports account selection, presence checks, black screen and native
  shared token vision. Control requests use GM-protected world settings; query
  payloads only request status. Never grant ownership or disable fog implicitly.
  Add further behavior only when explicitly requested. Audio and Encounter remain inactive.
- Keep imports free of side effects except the entry point's lifecycle registration.
- Use ApplicationV2 with HandlebarsApplicationMixin; avoid legacy application APIs.
- Localize user-visible strings and scope CSS beneath `.av-control`.
- Enforce GM access at UI entry points. Future network handlers must validate
  payloads and authority independently; never trust a payload's claimed sender.
- Do not add unused persistent settings or speculative socket protocols.
- Never edit, migrate or test against the production campaign world. Use a
  separate Foundry user-data directory and disposable test world.
- Run `npm run check` for changes and document Foundry-only verification honestly.
- No build step or runtime dependencies are required. Prefer Node built-in tools.
- Do not mark compatibility as verified until manually tested in that Foundry build.
