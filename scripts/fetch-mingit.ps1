$ErrorActionPreference = 'Stop'

$version = '2.55.0.5'
$releaseTag = 'v2.55.0.windows.5'
$archiveName = "MinGit-$version-64-bit.zip"
$expectedSha256 = '56d7b226b7693196cfc71fef26568f536c4a021ab6c37ff2db4287bed908e96e'
$downloadUrl = "https://github.com/git-for-windows/git/releases/download/$releaseTag/$archiveName"

$repositoryRoot = Split-Path -Parent $PSScriptRoot
$destination = Join-Path $repositoryRoot 'vendor\mingit'
$archivePath = Join-Path ([System.IO.Path]::GetTempPath()) $archiveName

Write-Host "Downloading verified MinGit $version..."
Invoke-WebRequest -Uri $downloadUrl -OutFile $archivePath

$actualSha256 = (Get-FileHash -Path $archivePath -Algorithm SHA256).Hash.ToLowerInvariant()
if ($actualSha256 -ne $expectedSha256) {
  Remove-Item $archivePath -Force -ErrorAction SilentlyContinue
  throw "MinGit checksum mismatch. Expected $expectedSha256, received $actualSha256."
}

Remove-Item $destination -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $destination -Force | Out-Null
Expand-Archive -Path $archivePath -DestinationPath $destination -Force
Remove-Item $archivePath -Force

$gitExecutable = Join-Path $destination 'cmd\git.exe'
if (-not (Test-Path $gitExecutable -PathType Leaf)) {
  throw "MinGit archive does not contain cmd\\git.exe."
}

$reportedVersion = (& $gitExecutable --version).Trim()
if ($LASTEXITCODE -ne 0) {
  throw "Bundled git.exe failed its version check."
}

Write-Host "Prepared $reportedVersion at $destination"
