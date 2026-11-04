# AV Control

A modular Foundry Virtual Tabletop V14 module for an in-person RPG campaign.
Version 0.3.0 adds black screen and checkbox-based shared player-token vision.
Connection tests retain their clearly marked results.

In a **disposable V14 test world**, enable AV Control, then open **Game Settings >
Configure Settings > AV Control > Open Control Panel**. The panel is restricted
to GMs, including direct render attempts by non-GMs. Choose a
dedicated non-GM player account, click **Save display account**, log that account
in on the shared screen, then click **Test connection**. See [Display setup and
manual tests](docs/DISPLAY.md).

The account selection is stored as a world-scoped module setting only when the
GM saves it. Connection tests use Foundry's managed socket queries and change no
scenes, camera positions, permissions, playlists or combat. Audio and Encounter
remain inactive, and no campaign migration is included.

**Black screen** covers the selected display browser. To show the map again,
choose player tokens and click **Apply shared vision / Show screen**. This uses
Foundry's native player vision; it requires the same single-level scene on both
clients, Token Vision enabled, and Owner access for the display account on the
chosen actors. The module never grants permissions or disables fog automatically.
Read [the screen setup and mandatory manual checks](docs/SCREEN.md) before testing.

The manifest targets V14 only. The 0.1.0 scaffold was tested by the user with
Foundry **14.369** and DnD **6.0.6**. The user also confirmed connection testing and
0.2.1 feedback. The new screen controls await manual Foundry verification, so
`compatibility.verified` is omitted for this release.
Releases are installed and updated directly from Foundry Setup using this stable
manifest URL (available after the first release is published):

```text
https://github.com/Ustabil/Foundry-VTT-AV-Control/releases/latest/download/module.json
```

See [release, installation and update instructions](docs/RELEASING.md).

See [development and manual testing](docs/DEVELOPMENT.md) and
[project conventions](AGENTS.md). No production campaign files are needed.
