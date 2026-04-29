param(
  [string[]]$Configurations = @("darwin-arm64", "darwin-x64"),
  [string]$NodeVersion = ""
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$package = Get-Content (Join-Path $root "package.json") -Raw | ConvertFrom-Json
$version = $package.version
if ([string]::IsNullOrWhiteSpace($NodeVersion)) {
  $NodeVersion = (node --version).Trim().TrimStart("v")
}

$dist = Join-Path $root "dist"
$cache = Join-Path $dist "cache"
New-Item -ItemType Directory -Force -Path $dist, $cache | Out-Null

foreach ($configuration in $Configurations) {
  if ($configuration -notin @("darwin-arm64", "darwin-x64")) {
    throw "Unsupported macOS configuration: $configuration"
  }

  $cpu = if ($configuration -eq "darwin-arm64") { "arm64" } else { "x64" }
  $releaseName = "DotaStreamKit-$version-$configuration"
  $releaseRoot = Join-Path $dist $releaseName
  $appDir = Join-Path $releaseRoot "app"
  $runtimeDir = Join-Path $releaseRoot "runtime"
  $archivePath = Join-Path $dist "$releaseName.tar.gz"
  $nodeArchive = Join-Path $cache "node-v$NodeVersion-$configuration.tar.gz"
  $nodeUrl = "https://nodejs.org/dist/v$NodeVersion/node-v$NodeVersion-$configuration.tar.gz"
  $nodeExtractDir = Join-Path $cache "node-v$NodeVersion-$configuration"

  if (Test-Path $releaseRoot) {
    Remove-Item -LiteralPath $releaseRoot -Recurse -Force
  }
  if (Test-Path $archivePath) {
    Remove-Item -LiteralPath $archivePath -Force
  }

  New-Item -ItemType Directory -Force -Path $appDir, $runtimeDir | Out-Null

  if (!(Test-Path $nodeArchive)) {
    Write-Host "Downloading Node.js $configuration runtime:"
    Write-Host "  $nodeUrl"
    Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeArchive
  }

  if (Test-Path $nodeExtractDir) {
    Remove-Item -LiteralPath $nodeExtractDir -Recurse -Force
  }
  tar -xzf $nodeArchive -C $cache "node-v$NodeVersion-$configuration/bin/node"
  if (!(Test-Path $nodeExtractDir)) {
    throw "Node runtime extraction failed: $nodeExtractDir"
  }

  Copy-Item -LiteralPath (Join-Path $nodeExtractDir "bin\node") -Destination (Join-Path $runtimeDir "node") -Force

  $items = @(
    "package.json",
    "package-lock.json",
    "README.md",
    "src",
    "public",
    "scripts"
  )

  foreach ($item in $items) {
    $source = Join-Path $root $item
    $target = Join-Path $appDir $item
    if (!(Test-Path $source)) {
      throw "Missing release item: $item"
    }
    Copy-Item -LiteralPath $source -Destination $target -Recurse -Force
  }

  Remove-Item -LiteralPath (Join-Path $appDir "scripts\launcher") -Recurse -Force -ErrorAction SilentlyContinue

  Push-Location $appDir
  try {
    npm ci --omit=dev --ignore-scripts --os=darwin --cpu=$cpu
  } finally {
    Pop-Location
  }

  $launcherPath = Join-Path $releaseRoot "DotaStreamKit"
  $launcher = @'
#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE="$ROOT/runtime/node"
SERVER="$ROOT/app/src/server.js"

chmod +x "$NODE" 2>/dev/null || true

if [ ! -x "$NODE" ]; then
  echo "Missing executable runtime/node" >&2
  exit 1
fi

if [ ! -f "$SERVER" ]; then
  echo "Missing app/src/server.js" >&2
  exit 1
fi

echo "Starting DotaStreamKit..."
echo "Dashboard: http://localhost:37273"
echo "OBS overlay: http://localhost:37273/overlay.html"
echo
echo "Keep this terminal open while streaming. Press Ctrl+C to stop DotaStreamKit."
echo

cd "$ROOT/app"
exec "$NODE" "$SERVER"
'@

  $launcher = $launcher -replace "`r`n", "`n"
  [System.IO.File]::WriteAllText($launcherPath, $launcher, [System.Text.UTF8Encoding]::new($false))

  tar -czf $archivePath -C $dist $releaseName

  Write-Host "Built release:"
  Write-Host "  $releaseRoot"
  Write-Host "  $archivePath"
}
