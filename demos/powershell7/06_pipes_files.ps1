# 演示点：管道与文件操作——目录列举排序、-Filter 通配、Select-String、Group-Object 统计
$fixtures = if ($env:HELLO_SHELL_FIXTURES) { $env:HELLO_SHELL_FIXTURES } else { '/fixtures' }
$dataDir = Join-Path $fixtures 'data'

# Get-ChildItem | Sort-Object：按名排序后拼成逗号列表
$names = Get-ChildItem $dataDir | Sort-Object Name | ForEach-Object { $_.Name }
Write-Output "globList=$($names -join ',')"

# -Filter 通配符只留 .log 文件
$logFiles = (Get-ChildItem $dataDir -Filter *.log | Measure-Object).Count
Write-Output "logFiles=$logFiles"

# Select-String 按模式匹配行，Measure-Object 数行
$requestLines = (Select-String -Path (Join-Path $dataDir 'app.log') -Pattern 'request' | Measure-Object).Count
Write-Output "requestLines=$requestLines"

# Import-Csv | Group-Object：按 status 分组，输出顺序固定 paid,pending,refunded
$groups = Import-Csv (Join-Path $fixtures 'orders.csv') | Group-Object status
$parts = foreach ($key in @('paid', 'pending', 'refunded')) {
    $group = $groups | Where-Object { $_.Name -eq $key }
    "${key}:$($group.Count)"
}
Write-Output "statusCounts=$($parts -join ',')"
exit 0
