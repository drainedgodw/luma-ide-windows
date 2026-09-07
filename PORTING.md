# Windows port foundation

The Windows edition preserves Luma's product behavior while replacing operating-system assumptions deliberately. The Linux repository remains unchanged.

## Initial scope

- [x] Import the Luma 0.2.0 source snapshot and binary assets.
- [x] Add a testable Windows terminal profile resolver.
- [x] Replace the Bash updater with a safe Windows release-page flow.
- [x] Add Windows x64 packaging and CI definitions.
- [x] Bundle a checksum-verified MinGit runtime and route Git commands through it.
- [x] Pass type checks, unit tests, the application build, native-module rebuild, runtime-content verification, and packaging on a Windows 2022 runner.
- [x] Publish a rolling unsigned preview installer and portable executable with SHA-256 checksums.
- [ ] Smoke-test the installer, portable executable, integrated terminal, Git operations, and workspace trust on Windows 10 and 11.

## Deliberate constraints

- PowerShell is the default integrated shell. `LUMA_SHELL` can override the executable.
- Packaged builds use bundled MinGit 2.55.0.5. `LUMA_GIT` can override it for development and diagnostics.
- The updater opens a verified GitHub release page instead of executing downloaded code.
- The first packages target Windows x64 only; arm64 support requires a separate verified build path.
- Preview binaries are not code-signed and may trigger SmartScreen.
- A stable release will not be announced until manual smoke checks pass.
