# 08_real_world: copy fixture data to scratch, rename *.log to *.log.bak, count and verify
$fixtures = $env:HELLO_SHELL_FIXTURES
$src = Join-Path $fixtures 'data'
$work = Join-Path $env:TEMP 'hello-shell-work'
if (Test-Path $work) { Remove-Item $work -Recurse -Force }
New-Item -ItemType Directory -Path $work | Out-Null

$dst = Join-Path $work 'data'
New-Item -ItemType Directory -Path $dst | Out-Null
Copy-Item (Join-Path $src '*') -Destination $dst

# prepared = files copied into the scratch dir
$prepared = @(Get-ChildItem $dst -File).Count

# rename every *.log to *.log.bak and count the results
$renamed = 0
foreach ($f in Get-ChildItem $dst -Filter *.log -File) {
    Rename-Item -LiteralPath $f.FullName -NewName ($f.Name + '.bak')
    $renamed += 1
}
$unchanged = $prepared - $renamed

# verify: the .bak file exists and the original .log is gone
$verify = 'fail'
if ((Test-Path (Join-Path $dst 'app.log.bak')) -and (-not (Test-Path (Join-Path $dst 'app.log')))) {
    $verify = 'ok'
}

Write-Output "prepared=$prepared"
Write-Output "renamed=$renamed"
Write-Output "unchanged=$unchanged"
Write-Output "verify=$verify"
Write-Output "report=prepared=$prepared,renamed=$renamed,unchanged=$unchanged"
