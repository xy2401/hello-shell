# 07_errors: try/catch, continuing after failure, strict-mode child exit code
$fixtures = $env:HELLO_SHELL_FIXTURES
$work = Join-Path $env:TEMP 'hello-shell-work'
if (Test-Path $work) { Remove-Item $work -Recurse -Force }
New-Item -ItemType Directory -Path $work | Out-Null

# -ErrorAction Stop turns the missing-file error into a terminating one we can catch
$caught = $false
try {
    Get-Content (Join-Path $fixtures 'no-such-file.txt') -ErrorAction Stop | Out-Null
} catch {
    $caught = $true
}
Write-Output ("caughtError=" + $caught.ToString().ToLower())
Write-Output "afterFailure=continued"

# PowerShell has no set -e, so run a strict-mode child and read its exit code;
# the child's error text goes to stderr and is discarded here to keep output clean
& powershell -NoProfile -Command '$ErrorActionPreference=''Stop''; Get-Content C:\nonexistent-hello-shell | Out-Null' 2> $null
Write-Output "setEExitCode=$LASTEXITCODE"
Write-Output "scriptExitCode=0"
