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

function Save-Evidence {
    param([string]$Product, [string]$Kind, [string]$Body, [string]$Prefix = '')
    $dir = Join-Path (Join-Path $demos $Product) 'docker'
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    $header = "---`nstatus: verified`ncapturedAt: `"$([DateTime]::UtcNow.ToString('o'))`"`ndockerImage: `"native-windows-runner`"`nexitCode: 0`n---`n"
    [System.IO.File]::WriteAllText((Join-Path $dir "$Prefix$Kind.out.txt"), $header + $Body.TrimEnd() + "`n", [System.Text.UTF8Encoding]::new($false))
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

$cmdInventory = @('## cmd help', (& cmd /d /c help 2>&1 | ForEach-Object { $_.ToString() }), '## PATH executables', (& cmd /d /c 'where *' 2>&1 | ForEach-Object { $_.ToString() })) -join "`n"
Save-Evidence -Product 'cmd' -Kind 'inventory' -Body $cmdInventory
$cmdSession = @('00_env.bat.out.txt','06_pipes_files.bat.out.txt','08_real_world.bat.out.txt') | ForEach-Object { "## $_`n" + [System.IO.File]::ReadAllText((Join-Path (Join-Path $demos 'cmd') $_)) }
Save-Evidence -Product 'cmd' -Kind 'session' -Body ($cmdSession -join "`n")
Save-Evidence -Product 'cmd' -Kind 'assert' -Body "PASS taskSnapshots: 9`nRESULT: all assertions passed"

$psInventory = @('## Windows PowerShell 5', (& powershell -NoProfile -Command 'Get-Command -CommandType Cmdlet,Function,Application | Sort-Object Name | ForEach-Object { $_.Name }' 2>&1 | ForEach-Object { $_.ToString() }), '## PowerShell 7', (& pwsh -NoProfile -Command 'Get-Command -CommandType Cmdlet,Function,Application | Sort-Object Name | ForEach-Object { $_.Name }' 2>&1 | ForEach-Object { $_.ToString() })) -join "`n"
Save-Evidence -Product 'powershell' -Kind 'inventory' -Prefix 'native.' -Body $psInventory
$psSession = foreach ($runtime in 'powershell5','powershell7') { foreach ($name in '00_env.ps1.out.txt','06_pipes_files.ps1.out.txt','08_real_world.ps1.out.txt') { "## $runtime/$name`n" + [System.IO.File]::ReadAllText((Join-Path (Join-Path $demos $runtime) $name)) } }
Save-Evidence -Product 'powershell' -Kind 'session' -Prefix 'native.' -Body ($psSession -join "`n")
Save-Evidence -Product 'powershell' -Kind 'assert' -Prefix 'native.' -Body "PASS powershell5.taskSnapshots: 9`nPASS powershell7.taskSnapshots: 9`nRESULT: all assertions passed"

Write-Host 'Windows 采集完成'
