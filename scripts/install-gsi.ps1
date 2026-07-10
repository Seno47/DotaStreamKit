param(
  [string]$DotaCfgDir = "C:\Program Files (x86)\Steam\steamapps\common\dota 2 beta\game\dota\cfg\gamestate_integration",
  [int]$Port = 37273,
  [string]$Token = ""
)

$ErrorActionPreference = "Stop"

New-Item -ItemType Directory -Force -Path $DotaCfgDir | Out-Null

if (-not $Token) {
  $repoRoot = Split-Path -Parent $PSScriptRoot
  $dataDir = if ([string]::IsNullOrWhiteSpace($env:DOTASTREAMKIT_DATA_DIR)) {
    Join-Path $repoRoot "data"
  } else {
    [Environment]::ExpandEnvironmentVariables($env:DOTASTREAMKIT_DATA_DIR)
  }
  $configPath = Join-Path $dataDir "config.json"
  if (Test-Path -LiteralPath $configPath) {
    $config = Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json
    $Token = [string]$config.dota.gsiToken
  }
}
if ($Token -notmatch '^[a-fA-F0-9]{64}$') {
  throw "Dota GSI token is missing. Start DotaStreamKit once, then use the Setup page or pass -Token explicitly."
}

$cfg = @"
"DotaStreamKit"
{
  "uri" "http://127.0.0.1:$Port/gsi/dota2"
  "timeout" "5.0"
  "buffer" "0.1"
  "throttle" "0.1"
  "heartbeat" "30.0"
  "auth"
  {
    "token" "$Token"
  }
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
