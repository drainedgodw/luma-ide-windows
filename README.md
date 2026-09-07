# Luma for Windows

Luma is a visual, Git-first desktop IDE. This repository is the Windows edition, split from the original Linux codebase so platform behavior, packaging, and releases can evolve independently.

> **Development status:** the Windows port is in active development. There is no verified stable Windows installer yet. The first milestone is tracked in [PORTING.md](PORTING.md).

## First milestone

- Native Windows x64 installer and portable package.
- Integrated PowerShell terminal with workspace-trust protection.
- Visual editing, search, Git history, staging, conflict tools, and GitHub workflows retained from Luma 0.2.0.
- Windows CI for type checks, tests, renderer builds, and packaging.

## Development setup

Requirements:

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

Create the Windows x64 installer and portable executable:

```powershell
npm run dist:win
```

Artifacts are written to `dist/`.

## Terminal selection

Luma uses Windows PowerShell by default. Set `LUMA_SHELL` before starting the app to use another executable, for example PowerShell 7:

```powershell
$env:LUMA_SHELL = 'C:\Program Files\PowerShell\7\pwsh.exe'
npm run dev
```

A workspace must be explicitly trusted before the integrated terminal or project tasks can run.

## Security

- Electron context isolation remains enabled and Node integration remains disabled in the renderer.
- Filesystem operations are constrained to the opened workspace.
- Updates open the repository release page; the Windows port does not execute a downloaded shell script.
- Do not commit tokens, `.env` files, local paths, or private repository data.

## Contributing

Keep changes focused, add tests for platform decisions, and verify documented commands before updating user-facing status. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT. See [LICENSE](LICENSE).
