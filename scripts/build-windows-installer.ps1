param(
  [string]$Configuration = "win-x64",
  [string]$InnoSetupCompiler = ""
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$package = Get-Content (Join-Path $root "package.json") -Raw | ConvertFrom-Json
$version = $package.version
$dist = Join-Path $root "dist"
$releaseName = "DotaStreamKit-$version-$Configuration"
$releaseRoot = Join-Path $dist $releaseName
$installerDir = Join-Path $dist "installer"
$issPath = Join-Path $installerDir "DotaStreamKit.iss"
$outputName = "DotaStreamKit-$version-$Configuration-Setup"

if (!(Test-Path (Join-Path $releaseRoot "DotaStreamKit.exe"))) {
  & (Join-Path $PSScriptRoot "build-windows-release.ps1") -Configuration $Configuration
}

if ([string]::IsNullOrWhiteSpace($InnoSetupCompiler)) {
  $candidates = @(
    (Join-Path $env:LOCALAPPDATA "Programs\Inno Setup 6\ISCC.exe"),
    "C:\Program Files (x86)\Inno Setup 6\ISCC.exe",
    "C:\Program Files\Inno Setup 6\ISCC.exe"
  )
  $InnoSetupCompiler = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
}

if ([string]::IsNullOrWhiteSpace($InnoSetupCompiler) -or !(Test-Path $InnoSetupCompiler)) {
  throw "Inno Setup 6 compiler not found. Install Inno Setup 6 or pass -InnoSetupCompiler."
}

New-Item -ItemType Directory -Force -Path $installerDir | Out-Null

$appId = "{{8D79D8EC-4F69-47CB-850C-D1B3F5D39D0B}"
$iss = @"
[Setup]
AppId=$appId
AppName=DotaStreamKit
AppVersion=$version
AppPublisher=Seno47
AppPublisherURL=https://github.com/Seno47/DotaStreamKit
AppSupportURL=https://github.com/Seno47/DotaStreamKit/issues
AppUpdatesURL=https://github.com/Seno47/DotaStreamKit/releases/latest
DefaultDirName={autopf}\DotaStreamKit
DefaultGroupName=DotaStreamKit
DisableProgramGroupPage=no
LicenseFile=$root\LICENSE
SetupIconFile=$root\scripts\launcher\DotaStreamKit.ico
OutputDir=$dist
OutputBaseFilename=$outputName
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
UninstallDisplayIcon={app}\DotaStreamKit.exe

[Tasks]
Name: "desktopicon"; Description: "Create a desktop shortcut"; GroupDescription: "Shortcuts:"; Flags: unchecked

[Files]
Source: "$releaseRoot\DotaStreamKit.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "$releaseRoot\DotaStreamKitUpdater.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "$releaseRoot\app\*"; DestDir: "{app}\app"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "$releaseRoot\runtime\*"; DestDir: "{app}\runtime"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\DotaStreamKit"; Filename: "{app}\DotaStreamKit.exe"
Name: "{group}\DotaStreamKit Dashboard"; Filename: "http://localhost:37273"
Name: "{group}\OBS overlay"; Filename: "http://localhost:37273/overlay.html"
Name: "{group}\GitHub Releases"; Filename: "https://github.com/Seno47/DotaStreamKit/releases"
Name: "{group}\Uninstall DotaStreamKit"; Filename: "{uninstallexe}"
Name: "{autodesktop}\DotaStreamKit"; Filename: "{app}\DotaStreamKit.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\DotaStreamKit.exe"; Description: "Launch DotaStreamKit"; Flags: nowait postinstall skipifsilent

[Code]
function SplitCommandLine(CommandLine: String; var FileName: String; var Params: String): Boolean;
var
  QuotePos: Integer;
  SpacePos: Integer;
begin
  CommandLine := Trim(CommandLine);
  Result := CommandLine <> '';
  if not Result then exit;

  if Copy(CommandLine, 1, 1) = '"' then begin
    QuotePos := Pos('"', Copy(CommandLine, 2, Length(CommandLine)));
    if QuotePos > 0 then begin
      FileName := Copy(CommandLine, 2, QuotePos - 1);
      Params := Trim(Copy(CommandLine, QuotePos + 2, Length(CommandLine)));
      exit;
    end;
  end;

  SpacePos := Pos(' ', CommandLine);
  if SpacePos > 0 then begin
    FileName := Copy(CommandLine, 1, SpacePos - 1);
    Params := Trim(Copy(CommandLine, SpacePos + 1, Length(CommandLine)));
  end else begin
    FileName := CommandLine;
    Params := '';
  end;
end;

function QueryUninstallString(var UninstallString: String): Boolean;
begin
  Result :=
    RegQueryStringValue(HKLM64, 'Software\Microsoft\Windows\CurrentVersion\Uninstall\{8D79D8EC-4F69-47CB-850C-D1B3F5D39D0B}_is1', 'UninstallString', UninstallString) or
    RegQueryStringValue(HKLM32, 'Software\Microsoft\Windows\CurrentVersion\Uninstall\{8D79D8EC-4F69-47CB-850C-D1B3F5D39D0B}_is1', 'UninstallString', UninstallString) or
    RegQueryStringValue(HKCU, 'Software\Microsoft\Windows\CurrentVersion\Uninstall\{8D79D8EC-4F69-47CB-850C-D1B3F5D39D0B}_is1', 'UninstallString', UninstallString);
end;

function ShowExistingInstallChoice(): Integer;
var
  Form: TSetupForm;
  TitleLabel: TNewStaticText;
  HintLabel: TNewStaticText;
  RepairButton: TNewButton;
  RemoveButton: TNewButton;
  CancelButton: TNewButton;
begin
  Form := CreateCustomForm(ScaleX(360), ScaleY(220), False, True);
  try
    Form.Caption := 'DotaStreamKit';

    TitleLabel := TNewStaticText.Create(Form);
    TitleLabel.Parent := Form;
    TitleLabel.Left := ScaleX(16);
    TitleLabel.Top := ScaleY(16);
    TitleLabel.Width := ScaleX(328);
    TitleLabel.Caption := 'DotaStreamKit is already installed.';

    HintLabel := TNewStaticText.Create(Form);
    HintLabel.Parent := Form;
    HintLabel.Left := ScaleX(16);
    HintLabel.Top := ScaleY(42);
    HintLabel.Width := ScaleX(328);
    HintLabel.Caption := 'Choose what setup should do:';

    RepairButton := TNewButton.Create(Form);
    RepairButton.Parent := Form;
    RepairButton.Left := ScaleX(16);
    RepairButton.Top := ScaleY(78);
    RepairButton.Width := ScaleX(200);
    RepairButton.Height := ScaleY(32);
    RepairButton.Caption := 'Update/Repair';
    RepairButton.ModalResult := mrOk;

    RemoveButton := TNewButton.Create(Form);
    RemoveButton.Parent := Form;
    RemoveButton.Left := ScaleX(16);
    RemoveButton.Top := ScaleY(118);
    RemoveButton.Width := ScaleX(200);
    RemoveButton.Height := ScaleY(32);
    RemoveButton.Caption := 'Remove';
    RemoveButton.ModalResult := mrAbort;

    CancelButton := TNewButton.Create(Form);
    CancelButton.Parent := Form;
    CancelButton.Left := ScaleX(16);
    CancelButton.Top := ScaleY(158);
    CancelButton.Width := ScaleX(200);
    CancelButton.Height := ScaleY(32);
    CancelButton.Caption := 'Cancel';
    CancelButton.ModalResult := mrCancel;

    Result := Form.ShowModal;
  finally
    Form.Free;
  end;
end;

function InitializeSetup(): Boolean;
var
  Choice: Integer;
  UninstallString: String;
  FileName: String;
  Params: String;
  ResultCode: Integer;
begin
  Result := True;
  if not QueryUninstallString(UninstallString) then exit;
  if WizardSilent() then exit;

  Choice := ShowExistingInstallChoice();

  if Choice = mrOk then exit;
  if Choice = mrAbort then begin
    if SplitCommandLine(UninstallString, FileName, Params) then begin
      Exec(FileName, Params + ' /SILENT /NORESTART', '', SW_SHOW, ewWaitUntilTerminated, ResultCode);
    end;
    Result := False;
    exit;
  end;

  Result := False;
end;
"@

[System.IO.File]::WriteAllText($issPath, $iss, [System.Text.UTF8Encoding]::new($false))

& $InnoSetupCompiler $issPath
if ($LASTEXITCODE -ne 0) {
  throw "Installer build failed"
}

Write-Host "Built installer:"
Write-Host "  $(Join-Path $dist "$outputName.exe")"
