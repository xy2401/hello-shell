# 03_args_parsing: re-exec self with sample args, then walk $args manually
$work = Join-Path $env:TEMP 'hello-shell-work'
if (Test-Path $work) { Remove-Item $work -Recurse -Force }
New-Item -ItemType Directory -Path $work | Out-Null

if ($args.Count -eq 0) {
    & powershell -NoProfile -ExecutionPolicy Bypass -File $PSCommandPath alice 'bob smith' --verbose -n 3
    exit $LASTEXITCODE
}

$firstArg = $args[0]
$secondArg = $args[1]
$verboseFlag = $false
$nValue = ''
for ($i = 0; $i -lt $args.Count; $i++) {
    if ($args[$i] -eq '--verbose') { $verboseFlag = $true }
    if (($args[$i] -eq '-n') -and (($i + 1) -lt $args.Count)) { $nValue = $args[$i + 1] }
}

Write-Output "invocation=$(Split-Path -Leaf $PSCommandPath)"
Write-Output "argCount=$($args.Count)"
Write-Output "firstArg=$firstArg"
Write-Output "secondArg=$secondArg"
Write-Output ("verboseFlag=" + $verboseFlag.ToString().ToLower())
Write-Output "nValue=$nValue"
