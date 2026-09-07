# Windows port foundation

The Windows edition preserves Luma's product behavior while replacing operating-system assumptions deliberately. The Linux repository remains unchanged.

## Initial scope

- [x] Import the Luma 0.2.0 source snapshot and binary assets.
- [x] Add a testable Windows terminal profile resolver.
- [x] Replace the Bash updater with a safe Windows release-page flow.
- [x] Add Windows x64 packaging and CI definitions.
- [x] Pass type checks, 37 unit tests, the application build, native-module rebuild, and packaging on a Windows 2022 runner.
- [ ] Smoke-test the installer, portable executable, integrated terminal, Git operations, and workspace trust on Windows 10 and 11.

## Deliberate constraints

- PowerShell is the default integrated shell. `LUMA_SHELL` can override the executable.
- The initial updater opens a verified GitHub release page instead of executing downloaded code.
- The first packages target Windows x64 only; arm64 support requires a separate verified build path.
- A stable release will not be announced until CI and manual smoke checks pass.
