param(
    [Parameter(Mandatory = $true)][int]$X,
    [Parameter(Mandatory = $true)][int]$Y,
    [Parameter(Mandatory = $true)][int]$Width,
    [Parameter(Mandatory = $true)][int]$Height
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

if ($Width -lt 10 -or $Height -lt 10) {
    throw 'Region too small'
}

$bitmap = New-Object System.Drawing.Bitmap $Width, $Height
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.CopyFromScreen($X, $Y, 0, 0, (New-Object System.Drawing.Size $Width, $Height))
$graphics.Dispose()

$path = Join-Path ([System.IO.Path]::GetTempPath()) ("dotastreamkit-ocr-{0}.png" -f ([Guid]::NewGuid().ToString('N')))
$bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
$bitmap.Dispose()

Write-Output $path
