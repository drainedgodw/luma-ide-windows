# Changelog

## 0.4.0 — Native panel blur

- Preserved the real transparent Electron content window with `backgroundMaterial: 'none'`; no gray or blue material is applied across the full application.
- Added a separate frameless, focusless, taskbar-hidden and click-through Windows Acrylic layer behind Luma.
- Clipped that native layer to measured rounded regions for the header, navigation, top-level glass view panels, welcome surface and terminal.
- Restored the 0–64 panel-blur slider and connected it to both the CSS panel filter and the native layer's visible intensity; zero hides the layer completely.
- Re-measures panel regions after layout, resize, transitions and workspace/view replacement so stale full-window material cannot survive a workspace switch.
- Validates, clamps and limits all renderer-provided native regions before using them in the main process.
- Does not read, capture, copy, cache or render the desktop wallpaper.
- Added geometry, malformed-payload and source-invariant tests for the panel-only architecture.
- Requires interactive Windows validation for movement, DPI, maximize/minimize, focus switching and perceived blur strength before the PR leaves draft.

## 0.3.0 — Stack fix

- Added reversible install/remove controls for packages, libraries and frameworks throughout Stack.
- Covers the complete visible catalog across Node, Python, Rust, Go, .NET, Java, C/C++, Windows tools, Android metadata, Unity Hub and Epic Games Launcher.
- Uses workspace-local manifests and environments wherever the ecosystem supports them.
- Keeps Workspace Trust, fixed package/runtime allowlists, `shell: false`, operation locks, bounded output and explicit command previews.
- Runtime removal is gated behind a typed `REMOVE` confirmation and never auto-uninstalls system runtimes.
- Added tests for Stack catalog coverage, generated commands and packaged helper discovery.
- Fixed repository-local Python detection so `.venv` continues to work without a system Python on PATH.

## 0.2.0

- Initial Windows port with NSIS and portable packages.
- Bundled MinGit and Node.js runtimes.
- Added GitHub preview release workflow and packaged-runtime verification.
