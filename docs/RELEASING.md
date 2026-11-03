# GitHub Releases distribution

## Addresses and version contract

Repository: <https://github.com/Ustabil/Foundry-VTT-AV-Control>

Stable Foundry manifest URL:

```text
https://github.com/Ustabil/Foundry-VTT-AV-Control/releases/latest/download/module.json
```

For the first release, the manifest contains:

```json
{
  "id": "av-control",
  "version": "0.1.0",
  "manifest": "https://github.com/Ustabil/Foundry-VTT-AV-Control/releases/latest/download/module.json",
  "download": "https://github.com/Ustabil/Foundry-VTT-AV-Control/releases/download/v0.1.0/av-control.zip"
}
```

The stable URL discovers updates; `download` always selects the exact tagged
version. It never uses `latest`. The source manifest, uploaded manifest and ZIP's
manifest are identical. GitHub Release assets are named **module.json** and
**av-control.zip**; their release tag and manifest identify the version.

Use numeric stable versions `MAJOR.MINOR.PATCH`, with a Git tag prefixed by `v`.
The checks reject inconsistent IDs, versions, tags or URLs. Each later release
must increase the version so Foundry detects an update. Keep `minimum` and
`maximum` at V14; declare `verified` only after the documented Foundry test.

## One-time GitHub setup

1. Push the project, including `.github/workflows/release.yml`, to the repository's
   default branch. In VS Code, use Source Control to stage, commit and **Sync
   Changes** (or **Push**). Review the outgoing changes first.
2. Ensure the repository and release downloads are publicly accessible. Standard
   Foundry manifest installation does not supply private GitHub credentials.
3. In GitHub **Settings > Actions > General**, ensure Actions can run and the
   checkout/setup-node actions are allowed. The workflow requests `contents: write`
   for the built-in `GITHUB_TOKEN`; no personal access token or server secret is
   required. Organization policies must permit that permission.

## First release through the GitHub interface

1. Confirm the default branch includes the workflow and all runtime files.
   `package.json` and `module.json` must both say `0.1.0`; the manifest's download
   URL must end in `/releases/download/v0.1.0/av-control.zip`.
2. Open GitHub **Actions > Release AV Control > Run workflow**.
3. Select the branch containing the reviewed release commit (normally the default
   branch), enter **v0.1.0** in the tag field, and click **Run workflow**.
4. Wait for the workflow to finish successfully. It validates the code, packages
   runtime files, creates tag `v0.1.0` at that exact commit and creates a draft
   release. It uploads both assets before publishing the release as **Latest**.
5. Open **Releases > AV Control v0.1.0**. Confirm `module.json` and
   `av-control.zip` appear under Assets. Do not use GitHub's automatic **Source
   code (zip)** download for Foundry.
6. Open the stable manifest URL in a signed-out browser. Confirm version `0.1.0`
   and the version-specific ZIP URL. Download that ZIP to confirm public access.
7. Perform installation and the Foundry smoke checklist in an isolated test world.

Do not create/publish a release manually in GitHub's Releases form first: the
workflow owns creating the draft, attaching assets and publishing. It also works
with immutable releases because the assets are attached while still a draft.
The manifest URL will return 404 until the first release is successfully published.

## Subsequent releases using VS Code and GitHub

1. In VS Code, change `package.json.version`, `module.json.version`, and the tag
   segment of `module.json.download` together; for example `0.1.1`, `0.1.1`, and
   `/v0.1.1/av-control.zip`. Leave `id` and `manifest` unchanged.
2. Run **Terminal > Run Task > npm: check**, or `npm run check` in the integrated
   terminal. For archive verification, run `npm run package -- v0.1.1` with `zip`
   and `unzip` installed. Review and commit changes through Source Control, then
   push them to GitHub.
3. Use **Actions > Release AV Control > Run workflow**, selecting the correct
   branch and entering `v0.1.1`. This is the recommended GUI release route.
4. Verify the completed release and install/update in the test environment.

Alternative for users who manage tags in VS Code: use the Command Palette's
**Git: Create Tag** on the release commit, enter the matching `vMAJOR.MINOR.PATCH`
tag, then **Git: Push Tags**. A pushed `v*` tag starts the same release workflow.
Use either this route or Run workflow for a version, not both.

Ordinary commits and branch pushes never publish releases. Every workflow release
is stable and becomes Latest, so do not use this flow for prereleases or older
maintenance releases. Do not move published tags or replace published assets;
publish a new version for fixes.

## Failed runs

Validation or packaging failures occur before a draft is created. Fix the source
and rerun on the correct commit. An existing tag must resolve to that commit.
If upload/publish fails after draft creation, inspect Actions and Releases. After
fixing the underlying permission/network issue, delete only the incomplete draft
through GitHub's Releases interface, retain its tag, then rerun the failed workflow
at the same commit. A complete published release is intentionally not overwritten.
If the tagged source itself needs changes, choose a new version and tag instead.

## Install from Foundry Setup on the separate server

1. Access the Foundry server's **Setup** screen and open **Add-on Modules**.
2. Click **Install Module**. Paste the stable manifest URL above into **Manifest
   URL**, then click **Install**. No module listing on foundryvtt.com is required.
3. Foundry downloads the manifest and versioned ZIP directly from GitHub. The
   development PC does not need to be online. The server needs outbound HTTPS
   access to GitHub and its release-asset download hosts.
4. Confirm **AV Control**, ID `av-control`, and the expected installed version.
5. For initial verification, launch a disposable V14 test world and enable the
   module there under **Manage Modules**, reload, and open **Configure Settings >
   AV Control > Open Control Panel** as GM. Follow [the smoke checklist](DEVELOPMENT.md).

Installing/updating a module package in Setup is separate from enabling it in a
world. This workflow does not connect to Foundry, launch a world or modify any
campaign documents. Keep initial testing separate from the production campaign.

## Update from Foundry Setup

1. After a newer release completes, return to **Setup > Add-on Modules**.
2. Ensure AV Control is not locked against updates, then use its **Update** action
   (or **Update All** if you also intend to update other unlocked modules).
3. Foundry reads the same stable manifest URL, detects the higher version and
   downloads the exact ZIP referenced by that manifest. Confirm the installed
   version, then reload test-world clients and repeat relevant smoke tests.

If updates are not detected, compare the installed version with the public stable
manifest, check for a locked package or incompatible Foundry version, and inspect
the server's network errors. A successful update cannot be demonstrated until
two different release versions exist. Test that path manually before relying on it.

## Runtime archive contents

The ZIP contains `module.json` at its root, JavaScript under `scripts/`, Handlebars
templates under `templates/`, CSS under `styles/`, and translation JSON under
`lang/`. The allowlist excludes README files (including component placeholders),
tests, tools, workflows, Git metadata, `package.json`, and local files. Update the
allowlist deliberately if future runtime asset types are introduced.

## References

- [GitHub release management and draft assets](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository)
- [GitHub Actions triggers](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)
- [Foundry manifests](https://foundryvtt.com/article/module-development/)
- [Foundry installation and updates](https://foundryvtt.com/article/modules/)
