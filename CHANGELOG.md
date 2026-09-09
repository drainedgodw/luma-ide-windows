# Changelog

All notable changes are documented here. Luma follows semantic versioning once stable; `0.x` releases may change behavior between prereleases.

## [0.4.0] - 2026-09-09

### Added

- Replaced the numeric panel-blur slider with one persisted **Blur** switch.
- Added native Windows Acrylic blur for the transparent Liquid Glass window.
- Kept the fixed 32 px frosted-panel blur as a fallback when native Acrylic is unavailable.

### Changed

- Any non-zero blur value saved by 0.3.0 migrates to the single enabled state; zero remains disabled.
- Turning Blur off selects the native `none` material while preserving Electron's real transparent window.
- Luma still never reads, copies, caches or renders the desktop wallpaper.

### Security

- The renderer sends only a boolean preference. The main process alone chooses between the fixed `acrylic` and `none` materials.

### Compatibility

- Native Acrylic depends on Windows and DWM support. Unsupported systems safely keep real transparency and the panel fallback instead of using a wallpaper imitation.

## [0.3.0] - 2026-09-08

### Fixed

- Rebuilt Languages & Ecosystem (Stack) so supported project dependencies have one-click install and remove actions.
- Added allowlisted runtime install/remove controls to every language card: Node.js, Python, Rust, Go, Java, .NET and C/C++.
- Added platform-aware runtime plans for Windows `winget` and Linux apt, dnf, pacman and zypper through `pkexec`.
- Added installed-state refresh, system-wide removal warnings and visible command output.
- Restored the original transparent Liquid Glass layout and moved blur control from the wallpaper to the interface panels.
- Added a persisted 0–64 px panel blur slider; the 32 px default preserves the original appearance.

### Security

- Require Workspace Trust for project package and system runtime mutations.
- Accept only shared-catalog package/runtime identifiers and build every command in the main process with `shell: false`.
- Bound process duration/output, serialize package-manager mutations and avoid executing repository-local Python during status detection.

### Known limitations

- Newly installed or removed system runtimes require a Luma restart so the application inherits the updated system PATH.

## [0.2.0] - 2026-09-06

### Added

- Pleasant, contextual interface sounds for regular taps, navigation, toggles, primary actions and destructive controls.
- Sound controls in Settings, including a master switch and volume slider.
- A draggable terminal divider with keyboard resizing, remembered height and a one-click maximize/restore control.

### Changed

- The integrated terminal now refits its PTY automatically while it is resized or maximized.
- Release metadata and in-app version information now identify the 0.2.0 line.

## [0.1.1] - 2026-09-01

### Added

- Anonymous update check against a plain `update.json` file (no accounts, no telemetry); the app offers an update only when a newer release exists, and Settings can reinstall to the latest main build.
- Unit tests for the graph lane layout.
- Release and nightly artifacts are signed with keyless cosign; `install.sh` verifies the signature when cosign is available.
- `install.sh --nightly` installs the rolling build of the latest main commit.

### Changed

- Simpler graph lane assignment.
- Bisect view tracks good/bad marks per commit.

## [0.1.0] - 2026-09-01

### Added

- Lanes history view and the Orbit web with pan and zoom.
- Visual staging, commit diffs, branch operations, rebase, bisect and Rescue.
- GitHub PAT/SSH repository access.
- Workspace Trust, Tasks/Test Center, local Risk Map, Operation Preview and Secret Guard.
- Session Capsules and rollback checkpoints.

### Known limitations

- Language Intelligence is not protocol-based LSP.
- Risk Map reflects local test results rather than GitHub CI.
- Capsules do not restore live PTY processes.
