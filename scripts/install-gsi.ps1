param(
  [string]$DotaCfgDir = "C:\Program Files (x86)\Steam\steamapps\common\dota 2 beta\game\dota\cfg\gamestate_integration",
  [int]$Port = 37273
)

$ErrorActionPreference = "Stop"

New-Item -ItemType Directory -Force -Path $DotaCfgDir | Out-Null

$cfg = @"
"DotaStreamKit"
{
  "uri" "http://127.0.0.1:$Port/gsi/dota2"
  "timeout" "5.0"
  "buffer" "0.1"
  "throttle" "0.1"
  "heartbeat" "30.0"
  "data"
  {
    "provider" "1"
    "map" "1"
    "player" "1"
    "hero" "1"
    "items" "1"
    "allplayers" "1"
    "draft" "1"
    "events" "1"
  }
}
"@

$path = Join-Path $DotaCfgDir "gamestate_integration_dotastreamkit.cfg"
Set-Content -Path $path -Value $cfg -Encoding ASCII
Write-Host "Installed Dota GSI config: $path"
Write-Host "Restart Dota 2 after installing this file."
