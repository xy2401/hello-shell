# Windows 侧输出采集器：在 windows-latest runner 上用内置 cmd / PowerShell 5 / PowerShell 7
# 运行统一任务脚本，输出写源码旁 *.out.txt（ASCII，无 BOM）。
# 用法：pwsh -NoProfile -File scripts/collect-windows.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$demos = Join-Path $root 'demos'
$env:HELLO_SHELL_FIXTURES = Join-Path $demos 'shared' 'fixtures'

function Save-Output {
    param([string]$Path, [string[]]$Lines)
    $text = (($Lines -join "`n").TrimEnd() + "`n")
    [System.IO.File]::WriteAllText($Path, $text, [System.Text.Encoding]::ASCII)
}

function Invoke-Demo {
    param([string]$Shell, [string]$Script, [string[]]$Lines, [int]$Code)
    $out = "$Script.out.txt"
    Save-Output -Path $out -Lines $Lines
    if ($Code -ne 0) {
        Write-Error "[$Shell] $(Split-Path -Leaf $Script) exitCode=$Code (expected 0)"
    }
    Write-Host "[$Shell] $(Split-Path -Leaf $Script) exitCode=$Code"
}

Write-Host '--- cmd ---'
foreach ($f in Get-ChildItem (Join-Path $demos 'cmd') -Filter *.bat | Sort-Object Name) {
    $lines = & cmd /c "`"$($f.FullName)`" 2>&1"
    Invoke-Demo -Shell 'cmd' -Script $f.FullName -Lines $lines -Code $LASTEXITCODE
}

Write-Host '--- powershell5 ---'
foreach ($f in Get-ChildItem (Join-Path $demos 'powershell5') -Filter *.ps1 | Sort-Object Name) {
    $lines = & powershell -NoProfile -ExecutionPolicy Bypass -File $f.FullName 2>&1 | ForEach-Object { $_.ToString() }
    Invoke-Demo -Shell 'powershell5' -Script $f.FullName -Lines $lines -Code $LASTEXITCODE
}

Write-Host '--- powershell7 ---'
foreach ($f in Get-ChildItem (Join-Path $demos 'powershell7') -Filter *.ps1 | Sort-Object Name) {
    $lines = & pwsh -NoProfile -File $f.FullName 2>&1 | ForEach-Object { $_.ToString() }
    Invoke-Demo -Shell 'powershell7' -Script $f.FullName -Lines $lines -Code $LASTEXITCODE
}

Write-Host 'Windows 采集完成'
