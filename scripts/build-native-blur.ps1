$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$root = Split-Path $PSScriptRoot -Parent
$source = Join-Path $root 'native/windows-blur/luma-native-blur.cpp'
$outputDirectory = Join-Path $root 'vendor/native'
$output = Join-Path $outputDirectory 'Luma.NativeBlur.exe'
$object = Join-Path $outputDirectory 'luma-native-blur.obj'

$compiler = Get-Command cl.exe -ErrorAction SilentlyContinue
if (-not $compiler) {
  throw 'cl.exe was not found. Run this script from an x64 Visual Studio Developer PowerShell.'
}
if (-not (Test-Path $source -PathType Leaf)) {
  throw "Native blur source is missing: $source"
}

New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
& $compiler.Source /nologo /TC /O2 /W4 /DUNICODE /D_UNICODE $source "/Fo:$object" "/Fe:$output" user32.lib
if ($LASTEXITCODE -ne 0) {
  throw "Native blur helper compilation failed with exit code $LASTEXITCODE."
}
if (-not (Test-Path $output -PathType Leaf)) {
  throw 'Native blur helper was not produced.'
}
Write-Host "Built $output"
