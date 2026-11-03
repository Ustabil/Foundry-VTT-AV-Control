# AV Control

A modular Foundry Virtual Tabletop V14 module for an in-person RPG campaign.
Version 0.1.0 provides initialization and a minimal GM control panel only.

In a **disposable V14 test world**, enable AV Control, then open **Game Settings >
Configure Settings > AV Control > Open Control Panel**. The panel is read-only
and restricted to GMs, including direct render attempts by non-GMs.

There is no Display, Audio or Encounter automation, persistent module setting,
socket transport, document update or campaign migration. Core currently registers
the panel menu; future coordination and transport belong there.

The manifest targets V14 only. `verified` is deliberately omitted until testing
in an actual Foundry build. Node checks do not establish Foundry compatibility.
This is a local scaffold; release download and manifest URLs are not configured.

See [development and manual testing](docs/DEVELOPMENT.md) and
[project conventions](AGENTS.md). No production campaign files are needed.
