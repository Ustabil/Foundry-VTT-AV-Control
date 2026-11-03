# AV Control

A modular Foundry Virtual Tabletop V14 module for an in-person RPG campaign.
Version 0.1.0 provides initialization and a minimal GM control panel only.

In a **disposable V14 test world**, enable AV Control, then open **Game Settings >
Configure Settings > AV Control > Open Control Panel**. The panel is read-only
and restricted to GMs, including direct render attempts by non-GMs.

There is no Display, Audio or Encounter automation, persistent module setting,
socket transport, document update or campaign migration. Core currently registers
the panel menu; future coordination and transport belong there.

The manifest targets V14 only and records Foundry **14.369** as verified for the
current scaffold. User testing with DnD **6.0.6** confirmed installation,
activation, GM panel operation without reported errors, and no player access.
See the development guide for remaining manual checks.
Releases are installed and updated directly from Foundry Setup using this stable
manifest URL (available after the first release is published):

```text
https://github.com/Ustabil/Foundry-VTT-AV-Control/releases/latest/download/module.json
```

See [release, installation and update instructions](docs/RELEASING.md).

See [development and manual testing](docs/DEVELOPMENT.md) and
[project conventions](AGENTS.md). No production campaign files are needed.
