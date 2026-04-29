param(
  [string]$DotaPath = "C:\SteamLibrary\steamapps\common\dota 2 beta"
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$pak = Join-Path $DotaPath "game\dota\pak01_dir.vpk"
$vrf = Join-Path $root "tools\vrf\Source2Viewer-CLI.exe"
$extracted = Join-Path $root "data\extracted"
$assetDir = Join-Path $root "data\assets"
$obsVtex = Join-Path $extracted "panorama__images__hero_selection__minimap_ward_obs_png.vtex_c"
$obsPng = Join-Path $extracted "panorama__images__hero_selection__minimap_ward_obs_png.png"
$sentryVtex = Join-Path $extracted "materials__vgui__hud__minimap_ward_invis_psd_46a724e0.vtex_c"
$sentryPng = Join-Path $extracted "materials__vgui__hud__minimap_ward_invis_psd_46a724e0.png"
$realisticVtex = Join-Path $extracted "materials__overviews__dota_psd.vtex_c"
$realisticPng = Join-Path $extracted "materials__overviews__dota_psd.png"
$simpleVtex = Join-Path $extracted "materials__overviews__dota_minimal_psd_f4e53729.vtex_c"
$simplePng = Join-Path $extracted "materials__overviews__dota_minimal_psd_f4e53729.png"

if (-not (Test-Path -LiteralPath $pak)) {
  throw "Dota pak not found: $pak"
}

if (-not (Test-Path -LiteralPath $vrf)) {
  throw "VRF CLI not found: $vrf"
}

New-Item -ItemType Directory -Force -Path $extracted | Out-Null
New-Item -ItemType Directory -Force -Path $assetDir | Out-Null

node (Join-Path $root "scripts\extract-vpk-file.js") $pak "panorama/images/hero_selection/minimap_ward_obs_png" $extracted
node (Join-Path $root "scripts\extract-vpk-file.js") $pak "materials/vgui/hud/minimap_ward_invis_psd_46a724e0" $extracted
node (Join-Path $root "scripts\extract-vpk-file.js") $pak "materials/overviews/dota_psd" $extracted
node (Join-Path $root "scripts\extract-vpk-file.js") $pak "materials/overviews/dota_minimal_psd" $extracted

if (-not (Test-Path -LiteralPath $obsVtex)) {
  throw "Extracted observer VTEX file not found: $obsVtex"
}

& $vrf -i $obsVtex -o $extracted -d

if (-not (Test-Path -LiteralPath $obsPng)) {
  throw "Converted observer PNG not found: $obsPng"
}

Copy-Item -LiteralPath $obsPng -Destination (Join-Path $assetDir "ward-eye.png") -Force

if (Test-Path -LiteralPath $sentryVtex) {
  & $vrf -i $sentryVtex -o $extracted -d
  if (Test-Path -LiteralPath $sentryPng) {
    Copy-Item -LiteralPath $sentryPng -Destination (Join-Path $assetDir "sentry-eye.png") -Force
  }
}

if (Test-Path -LiteralPath $realisticVtex) {
  & $vrf -i $realisticVtex -o $extracted -d
  if (Test-Path -LiteralPath $realisticPng) {
    Copy-Item -LiteralPath $realisticPng -Destination (Join-Path $assetDir "minimap-base-realistic.png") -Force
  }
}

if (Test-Path -LiteralPath $simpleVtex) {
  & $vrf -i $simpleVtex -o $extracted -d
  if (Test-Path -LiteralPath $simplePng) {
    Copy-Item -LiteralPath $simplePng -Destination (Join-Path $assetDir "minimap-base-simple.png") -Force
  }
}

Remove-Item -LiteralPath (Join-Path $assetDir "minimap-wards.png") -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath (Join-Path $assetDir "ward-eye-green.png") -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath (Join-Path $assetDir "sentry-eye-green.png") -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath (Join-Path $assetDir "fake-minimap-vision-realistic.png") -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath (Join-Path $assetDir "fake-minimap-vision-simple.png") -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath (Join-Path $assetDir "fake-minimap-vision-empty.png") -Force -ErrorAction SilentlyContinue

Write-Host "Extracted Dota ward minimap icon:"
Write-Host "  $obsPng"
if (Test-Path -LiteralPath (Join-Path $assetDir "sentry-eye.png")) {
  Write-Host "Extracted Dota sentry minimap icon:"
  Write-Host "  $sentryPng"
}
Write-Host "Copied to:"
Write-Host "  $(Join-Path $assetDir "ward-eye.png")"
Write-Host "Restart DotaStreamKit to rebuild minimap assets."
