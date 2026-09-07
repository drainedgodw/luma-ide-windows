# Windows port foundation

The first development slice keeps the Linux product behavior while replacing platform assumptions deliberately.

## Initial scope

- Build and package on Windows x64.
- Resolve PowerShell safely for the integrated terminal.
- Disable the shell-based Linux updater until a native Windows update path exists.
- Exercise type checks and tests on a Windows CI runner.

Implementation changes will stay on `feat/windows-foundation` until the imported source builds and tests on Windows.
