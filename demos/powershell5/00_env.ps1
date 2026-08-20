# 00_env: shell identity - version string, shell name, platform
$work = Join-Path $env:TEMP 'hello-shell-work'
if (Test-Path $work) { Remove-Item $work -Recurse -Force }
New-Item -ItemType Directory -Path $work | Out-Null

Write-Output ("version=PowerShell " + $PSVersionTable.PSVersion.ToString())
Write-Output "shell=powershell5"
Write-Output "platform=windows"
