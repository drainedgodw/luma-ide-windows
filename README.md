<div align="center">

<img src="build/icon.png" width="96" alt="Luma logo" />

# Luma for Windows

**A visual, Git-first desktop IDE for Windows 10 and 11.**

![platform](https://img.shields.io/badge/platform-Windows%2010%2F11-0078d4) ![architecture](https://img.shields.io/badge/architecture-x64-64748b) ![status](https://img.shields.io/badge/status-preview-f59e0b) ![license](https://img.shields.io/badge/license-MIT-22c55e)

</div>

> [!WARNING]
> This is an unsigned preview. Automated tests and package-content checks pass, but manual Windows 10/11 smoke testing is still pending. Microsoft Defender SmartScreen may show a warning.

## Download

[**Download the self-contained Luma installer for Windows x64**](https://github.com/drainedgodw/luma-ide-windows/releases/download/windows-preview/Luma-Windows-Setup-x64.exe)

The installer includes:

- the Electron runtime and complete Luma application;
- production Node dependencies;
- the native `node-pty` terminal module;
- checksum-verified MinGit 2.55.0.5 for Git operations;
- application images, resources, and third-party notices.

After downloading the installer, no separate Node.js, npm, Python, Visual Studio, or Git installation is required to run Luma.

Alternative downloads:

- [Portable Windows x64 executable](https://github.com/drainedgodw/luma-ide-windows/releases/download/windows-preview/Luma-Windows-Portable-x64.exe)
- [SHA-256 checksums](https://github.com/drainedgodw/luma-ide-windows/releases/download/windows-preview/SHA256SUMS.txt)
- [Preview release notes](https://github.com/drainedgodw/luma-ide-windows/releases/tag/windows-preview)

Installer SHA-256: `3d2cb2d090678642e8c63228f0b8e6fe2305cbbe9497e0926bf586eb4e394a8a`

## Development status

Windows runtime, packaging, bundled Git support, and the rolling preview release are being developed in [draft PR #1](https://github.com/drainedgodw/luma-ide-windows/pull/1). The separate Linux repository is not modified by this port.

## License

[MIT](LICENSE). Bundled third-party components retain their own licenses and notices inside the installed application.
