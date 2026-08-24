# $LASTEXITCODE belongs to native processes; $? reports the latest PowerShell command.
& pwsh -NoProfile -Command 'exit 7'
$nativeExit = $LASTEXITCODE
Get-Content -LiteralPath '/nonexistent-hello-shell' -ErrorAction SilentlyContinue
$cmdletSucceeded = $?
$afterCmdletExit = $LASTEXITCODE
Write-Output "nativeExit=$nativeExit"
Write-Output "cmdletSucceeded=$($cmdletSucceeded.ToString().ToLower())"
Write-Output "afterCmdletLastExit=$afterCmdletExit"
