# 05_functions_scope: function return values, child-process exit codes, local variable scope
$work = Join-Path $env:TEMP 'hello-shell-work'
if (Test-Path $work) { Remove-Item $work -Recurse -Force }
New-Item -ItemType Directory -Path $work | Out-Null

function Get-Answer {
    return 42
}
$result = Get-Answer
Write-Output "functionResult=$result"

# a function cannot exit the script with a code, so spawn a child that does
& powershell -NoProfile -Command "exit 7"
Write-Output "exitCodeReturn=$LASTEXITCODE"

# assignments inside a function stay in its child scope
$globalVar = 'outer'
function Set-DemoScope {
    $local = 'inner'
    $globalVar = $local
}
Set-DemoScope
Write-Output "afterCall=$globalVar"
