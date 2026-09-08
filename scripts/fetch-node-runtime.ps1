$ErrorActionPreference = 'Stop'

$version = '22.22.0'
$archiveName = "node-v$version-win-x64.zip"
$expectedSha256 = 'c97fa376d2becdc8863fcd3ca2dd9a83a9f3468ee7ccf7a6d076ec66a645c77a'
$downloadUrl = "https://nodejs.org/dist/v$version/$archiveName"

$repositoryRoot = Split-Path -Parent $PSScriptRoot
$destination = Join-Path $repositoryRoot 'vendor\node'
$archivePath = Join-Path ([System.IO.Path]::GetTempPath()) $archiveName
$extractPath = Join-Path ([System.IO.Path]::GetTempPath()) "luma-node-$version-$([Guid]::NewGuid())"

try {
  Write-Host "Downloading verified Node.js $version runtime..."
  Invoke-WebRequest -Uri $downloadUrl -OutFile $archivePath

  $actualSha256 = (Get-FileHash -Path $archivePath -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($actualSha256 -ne $expectedSha256) {
    throw "Node.js checksum mismatch. Expected $expectedSha256, received $actualSha256."
  }

  New-Item -ItemType Directory -Path $extractPath -Force | Out-Null
  Expand-Archive -Path $archivePath -DestinationPath $extractPath -Force
  $expandedRoot = Join-Path $extractPath "node-v$version-win-x64"
  if (-not (Test-Path $expandedRoot -PathType Container)) {
    throw "Node.js archive does not contain the expected root directory."
  }

  Remove-Item $destination -Recurse -Force -ErrorAction SilentlyContinue
  New-Item -ItemType Directory -Path (Split-Path -Parent $destination) -Force | Out-Null
  Move-Item -Path $expandedRoot -Destination $destination

  $nodeExecutable = Join-Path $destination 'node.exe'
  $npmCli = Join-Path $destination 'node_modules\npm\bin\npm-cli.js'
  if (-not (Test-Path $nodeExecutable -PathType Leaf) -or -not (Test-Path $npmCli -PathType Leaf)) {
    throw "Node.js archive does not contain node.exe and npm-cli.js."
  }

  & $nodeExecutable --version
  if ($LASTEXITCODE -ne 0) { throw 'Bundled node.exe failed its version check.' }
  & $nodeExecutable $npmCli --version
  if ($LASTEXITCODE -ne 0) { throw 'Bundled npm CLI failed its version check.' }
  Write-Host "Prepared Node.js $version and npm at $destination"
} finally {
  Remove-Item $archivePath -Force -ErrorAction SilentlyContinue
  Remove-Item $extractPath -Recurse -Force -ErrorAction SilentlyContinue
}
