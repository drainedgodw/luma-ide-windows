# Luma for Windows

Luma is a visual, Git-first desktop IDE. This repository is the Windows edition, split from the original Linux codebase so platform behavior, packaging, and releases can evolve independently.

**Current update: Luma 0.3.0 — Fix Stack bug.**

> **Preview status:** automated Windows packaging passes and the application has launched successfully on Windows. Manual Stack install/remove smoke testing is still pending. The download below is unsigned and not yet a stable release.

## Download for Windows

[**Download Luma installer for Windows 10/11 x64**](https://github.com/drainedgodw/luma-ide-windows/releases/download/windows-preview/Luma-Windows-Setup-x64.exe)

The installer is self-contained. It includes the Electron runtime, Luma application files, production dependencies, the native terminal module, and verified MinGit for Git operations. You do **not** need to install Node.js, npm, Python, Visual Studio, or Git separately to run the installed application.

- [Portable x64 executable](https://github.com/drainedgodw/luma-ide-windows/releases/download/windows-preview/Luma-Windows-Portable-x64.exe)
- [SHA-256 checksums](https://github.com/drainedgodw/luma-ide-windows/releases/download/windows-preview/SHA256SUMS.txt)
- [Preview release notes](https://github.com/drainedgodw/luma-ide-windows/releases/tag/windows-preview)

Because this preview is not code-signed yet, Microsoft Defender SmartScreen may show a warning. Verify the checksum before running it. The current milestone and remaining manual checks are tracked in [PORTING.md](PORTING.md).

## First milestone

- Native Windows x64 installer and portable package.
- Integrated PowerShell terminal with workspace-trust protection.
- Bundled, checksum-verified MinGit runtime.
- Visual editing, search, Git history, staging, conflict tools, and GitHub workflows retained from Luma 0.2.0.
- Windows CI for type checks, tests, renderer builds, runtime verification, and packaging.
- Reversible in-app Stack package actions with installed-state detection and Workspace Trust protection.

## Development setup

Requirements for source development only:

- Windows 10 or 11 x64
- [Node.js 22.20](https://nodejs.org/) and npm 10 or newer
- [Git for Windows](https://git-scm.com/download/win)
- Python 3.11 for the current native-module rebuild toolchain
- Visual Studio 2022 Build Tools with the **Desktop development with C++** workload if `node-pty` needs a local rebuild

```powershell
git clone https://github.com/drainedgodw/luma-ide-windows.git
Set-Location luma-ide-windows
npm ci
npm run dev
```

Run the quality checks:

```powershell
npm run check
npm run build
```

Create the self-contained Windows x64 installer and portable executable:

```powershell
npm run dist:win
```

The build downloads the pinned MinGit archive, verifies its SHA-256 checksum, and writes packages to `dist/`.

## Runtime overrides

Luma uses Windows PowerShell by default. Set `LUMA_SHELL` before starting the app to use another terminal executable, for example PowerShell 7:

```powershell
$env:LUMA_SHELL = 'C:\Program Files\PowerShell\7\pwsh.exe'
npm run dev
```

Packaged builds use the bundled MinGit executable. Developers can set `LUMA_GIT` to test another `git.exe` explicitly.

A workspace must be explicitly trusted before the integrated terminal or project tasks can run.

## Security

- Electron context isolation remains enabled and Node integration remains disabled in the renderer.
- Filesystem operations are constrained to the opened workspace.
- MinGit is downloaded from the official Git for Windows release and checked against a pinned SHA-256 digest before packaging.
- Updates open the repository release page; the Windows port does not execute a downloaded shell script.
- Do not commit tokens, `.env` files, local paths, or private repository data.

Third-party software and source links are documented in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Contributing

Keep changes focused, add tests for platform decisions, and verify documented commands before updating user-facing status. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT. See [LICENSE](LICENSE).
