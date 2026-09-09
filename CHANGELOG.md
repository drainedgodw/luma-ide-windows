# Changelog

All notable changes are documented here. Luma follows semantic versioning once stable; `0.x` releases may change behavior between prereleases.

## [0.4.0] - 2026-09-09

### Fixed

- Removed the rejected whole-window Acrylic material that covered Luma with a gray or blue backdrop.
- Explicitly keep the Windows background material set to `none`; the root window remains genuinely transparent.
- Restored the 0–64 px panel slider and scope its CSS filter only to the header, sidebar, main surface, terminal and nested glass blocks.
- Prevented the native material from persisting or changing after switching between workspaces.
- Luma still never reads, copies, caches or renders the desktop wallpaper.

### Compatibility

- Electron CSS cannot sample or blur pixels from applications or the Windows desktop behind a transparent window. The restored slider affects only content inside Electron; real panel-only desktop blur requires a different native window/composition architecture.

## [0.3.0] - 2026-09-08

### Fixed

- Rebuilt Languages & Ecosystem (Stack) so supported project dependencies have one-click install and remove actions.
- Added allowlisted runtime install/remove controls to every language card: Node.js, Python, Rust, Go, Java, .NET and C/C++.
- Added platform-aware runtime plans for Windows `winget` and Linux apt, dnf, pacman and zypper through `pkexec`.
- Added installed-state refresh, system-wide removal warnings and visible command output.
- Restored the original transparent Liquid Glass layout and moved blur control from the wallpaper to the interface panels.

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

## [0.1.1] - 2026-09-01

### Added

- Anonymous update checks with no accounts or telemetry.
- Unit tests for the graph lane layout.
- Signed release and nightly artifacts.

## [0.1.0] - 2026-09-01

### Added

- Lanes history view and the Orbit web with pan and zoom.
- Visual staging, commit diffs, branch operations, rebase, bisect and Rescue.
- GitHub PAT/SSH repository access.
- Workspace Trust, Tasks/Test Center, local Risk Map, Operation Preview and Secret Guard.
