# 演示点：综合实战——复制 fixture 到暂存目录、改名、统计并校验（先删后建保证幂等）
$fixtures = if ($env:HELLO_SHELL_FIXTURES) { $env:HELLO_SHELL_FIXTURES } else { '/fixtures' }
$work = if ($IsWindows) { Join-Path $env:TEMP 'hello-shell-work' } else { '/tmp/work' }

if (Test-Path $work) { Remove-Item $work -Recurse -Force }
New-Item -ItemType Directory -Path $work | Out-Null

# 复制 fixtures/data 下的文件到暂存目录并计数
Copy-Item -Path (Join-Path $fixtures 'data' '*') -Destination $work
$prepared = (Get-ChildItem $work | Measure-Object).Count
Write-Output "prepared=$prepared"

# *.log 改名为 *.log.bak，@() 先固化列表避免边遍历边改名
$renamed = 0
foreach ($file in @(Get-ChildItem $work -Filter *.log)) {
    Rename-Item -Path $file.FullName -NewName ($file.Name + '.bak')
    $renamed += 1
}
Write-Output "renamed=$renamed"

# 未改名文件 = 总数里不含 .bak 后缀的部分
$unchanged = (Get-ChildItem $work | Where-Object { $_.Name -notlike '*.bak' } | Measure-Object).Count
Write-Output "unchanged=$unchanged"

# 校验：app.log.bak 存在且 app.log 已消失
$bakExists = Test-Path (Join-Path $work 'app.log.bak')
$logGone = -not (Test-Path (Join-Path $work 'app.log'))
$verify = if ($bakExists -and $logGone) { 'ok' } else { 'fail' }
Write-Output "verify=$verify"

Write-Output "report=prepared=$prepared,renamed=$renamed,unchanged=$unchanged"
exit 0
