param(
  [string]$Configuration = "win-x64",
  [string]$NodeExe = "C:\Program Files\nodejs\node.exe"
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$version = (Get-Content (Join-Path $root "package.json") -Raw | ConvertFrom-Json).version
$dist = Join-Path $root "dist"
$releaseName = "DotaStreamKit-$version-$Configuration"
$releaseRoot = Join-Path $dist $releaseName
$appDir = Join-Path $releaseRoot "app"
$runtimeDir = Join-Path $releaseRoot "runtime"
$launcherSource = Join-Path $PSScriptRoot "launcher\DotaStreamKitLauncher.cs"
$launcherExe = Join-Path $releaseRoot "DotaStreamKit.exe"
$zipPath = Join-Path $dist "$releaseName.zip"
$csc = "$env:WINDIR\Microsoft.NET\Framework64\v4.0.30319\csc.exe"

if (!(Test-Path $NodeExe)) {
  throw "Node runtime not found: $NodeExe"
}
if (!(Test-Path $csc)) {
  throw "C# compiler not found: $csc"
}

if (Test-Path $releaseRoot) {
  Remove-Item -LiteralPath $releaseRoot -Recurse -Force
}
if (Test-Path $zipPath) {
  Remove-Item -LiteralPath $zipPath -Force
}

New-Item -ItemType Directory -Force -Path $appDir, $runtimeDir | Out-Null

Copy-Item -LiteralPath $NodeExe -Destination (Join-Path $runtimeDir "node.exe") -Force

$items = @(
  "package.json",
  "package-lock.json",
  "README.md",
  "LICENSE",
  "SECURITY.md",
  "src",
  "public",
  "scripts",
  "node_modules"
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

& $csc /nologo /target:exe /out:$launcherExe $launcherSource
if ($LASTEXITCODE -ne 0) {
  throw "Launcher compilation failed"
}

Compress-Archive -LiteralPath $releaseRoot -DestinationPath $zipPath -CompressionLevel Optimal

Write-Host "Built release:"
Write-Host "  $releaseRoot"
Write-Host "  $zipPath"
