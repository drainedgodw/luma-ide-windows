$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$root = Split-Path $PSScriptRoot -Parent
$source = Join-Path $root 'native/windows-blur/luma-native-blur.cpp'
$outputDirectory = Join-Path $root 'vendor/native'
$output = Join-Path $outputDirectory 'Luma.NativeBlur.exe'
$object = Join-Path $outputDirectory 'luma-native-blur.obj'
$commandFile = Join-Path $outputDirectory 'build-native-blur.cmd'
$vswhere = Join-Path ([Environment]::GetFolderPath('ProgramFilesX86')) 'Microsoft Visual Studio/Installer/vswhere.exe'

if (-not (Test-Path $source -PathType Leaf)) {
  throw "Native blur source is missing: $source"
}
if (-not (Test-Path $vswhere -PathType Leaf)) {
  throw 'Visual Studio Installer discovery tool (vswhere.exe) was not found.'
}
$installation = (& $vswhere -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath | Select-Object -First 1)
if (-not $installation) {
  throw 'Visual Studio C++ x64 build tools were not found.'
}
$developerCommand = Join-Path $installation 'Common7/Tools/VsDevCmd.bat'
if (-not (Test-Path $developerCommand -PathType Leaf)) {
  throw "Visual Studio developer command file is missing: $developerCommand"
}

New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
@(
  '@echo off',
  "call `"$developerCommand`" -arch=x64 -host_arch=x64",
  'if errorlevel 1 exit /b %errorlevel%',
  "cl.exe /nologo /TC /O2 /W4 /DUNICODE /D_UNICODE `"$source`" /Fo`"$object`" /Fe`"$output`" /link user32.lib",
  'exit /b %errorlevel%'
) | Set-Content -Path $commandFile -Encoding ascii

& $env:ComSpec /d /c "call `"$commandFile`""
$status = $LASTEXITCODE
Remove-Item $commandFile -Force -ErrorAction SilentlyContinue
if ($status -ne 0) {
  throw "Native blur helper compilation failed with exit code $status."
}
if (-not (Test-Path $output -PathType Leaf)) {
  throw 'Native blur helper was not produced.'
}
Remove-Item $object -Force -ErrorAction SilentlyContinue
Write-Host "Built $output"
