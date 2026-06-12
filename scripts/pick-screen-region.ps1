param(
    [string]$ResultFile = ''
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$form = New-Object System.Windows.Forms.Form
$form.FormBorderStyle = [System.Windows.Forms.FormBorderStyle]::None
$form.StartPosition = [System.Windows.Forms.FormStartPosition]::Manual
$form.ShowInTaskbar = $false
$form.TopMost = $true
$form.BackColor = [System.Drawing.Color]::Black
$form.Opacity = 0.35
$form.Cursor = [System.Windows.Forms.Cursors]::Cross
$form.KeyPreview = $true

$virtual = [System.Windows.Forms.SystemInformation]::VirtualScreen
$form.SetBounds($virtual.Left, $virtual.Top, $virtual.Width, $virtual.Height)

$script:startPoint = $null
$script:currentPoint = $null
$script:result = $null

$form.Add_Paint({
    param($sender, $e)
    if ($null -eq $script:startPoint -or $null -eq $script:currentPoint) { return }
    $x1 = [Math]::Min($script:startPoint.X, $script:currentPoint.X)
    $y1 = [Math]::Min($script:startPoint.Y, $script:currentPoint.Y)
    $w = [Math]::Abs($script:currentPoint.X - $script:startPoint.X)
    $h = [Math]::Abs($script:currentPoint.Y - $script:startPoint.Y)
    if ($w -lt 1 -or $h -lt 1) { return }
    $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(80, 99, 201, 255))
    $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(220, 99, 201, 255), 2)
    $rect = New-Object System.Drawing.Rectangle $x1, $y1, $w, $h
    $e.Graphics.FillRectangle($brush, $rect)
    $e.Graphics.DrawRectangle($pen, $rect)
    $brush.Dispose()
    $pen.Dispose()
})

$form.Add_MouseDown({
    param($sender, $e)
    if ($e.Button -ne [System.Windows.Forms.MouseButtons]::Left) { return }
    $script:startPoint = $e.Location
    $script:currentPoint = $e.Location
    $form.Invalidate()
})

$form.Add_MouseMove({
    param($sender, $e)
    if ($null -eq $script:startPoint) { return }
    $script:currentPoint = $e.Location
    $form.Invalidate()
})

$form.Add_MouseUp({
    param($sender, $e)
    if ($e.Button -ne [System.Windows.Forms.MouseButtons]::Left) { return }
    if ($null -eq $script:startPoint) { return }
    $script:currentPoint = $e.Location
    $x1 = [Math]::Min($script:startPoint.X, $script:currentPoint.X)
    $y1 = [Math]::Min($script:startPoint.Y, $script:currentPoint.Y)
    $w = [Math]::Abs($script:currentPoint.X - $script:startPoint.X)
    $h = [Math]::Abs($script:currentPoint.Y - $script:startPoint.Y)
    if ($w -ge 10 -and $h -ge 10) {
        $script:result = @{
            x = [int]($form.Left + $x1)
            y = [int]($form.Top + $y1)
            width = [int]$w
            height = [int]$h
        }
        $form.Close()
    }
})

$form.Add_KeyDown({
    param($sender, $e)
    if ($e.KeyCode -eq [System.Windows.Forms.Keys]::Escape) {
        $script:result = @{ cancelled = $true }
        $form.Close()
    }
})

[void]$form.ShowDialog()

if (-not $script:result) {
    $script:result = @{ cancelled = $true }
}

$json = if ($script:result.cancelled) {
    '{"cancelled":true}'
} else {
    $script:result | ConvertTo-Json -Compress
}

if ($ResultFile) {
    [System.IO.File]::WriteAllText($ResultFile, $json, [System.Text.UTF8Encoding]::new($false))
}

[Console]::Out.WriteLine($json)
