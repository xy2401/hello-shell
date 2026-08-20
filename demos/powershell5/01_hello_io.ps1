# 01_hello_io: stdout vs stderr streams and capturing a failing child exit code
$work = Join-Path $env:TEMP 'hello-shell-work'
if (Test-Path $work) { Remove-Item $work -Recurse -Force }
New-Item -ItemType Directory -Path $work | Out-Null

Write-Output "stdout: hello from powershell5"
# write straight to the stderr stream without raising a PowerShell error record
[Console]::Error.WriteLine("stderr: this line goes to stderr")
# run a failing command in a child cmd and capture its nonzero exit code
& cmd /c "dir C:\nonexistent-hello-shell >nul 2>nul"
Write-Output "childExitCode=$LASTEXITCODE"
Write-Output "scriptExitCode=0"
