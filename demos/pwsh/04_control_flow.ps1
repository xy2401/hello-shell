# 演示点：控制流——range 求和、foreach + if 过滤 CSV、遍历目录计数
$fixtures = if ($env:HELLO_SHELL_FIXTURES) { $env:HELLO_SHELL_FIXTURES } else { '/fixtures' }

# 1..3 是范围数组，foreach 累加求和
$sum = 0
foreach ($n in 1..3) {
    $sum += $n
}
Write-Output "sum123=$sum"

# Import-Csv 把每行变对象，if 按列值过滤计数
$paidCount = 0
foreach ($order in Import-Csv (Join-Path $fixtures 'orders.csv')) {
    if ($order.status -eq 'paid') {
        $paidCount += 1
    }
}
Write-Output "paidCount=$paidCount"

# foreach 遍历目录项计数
$loopFiles = 0
foreach ($file in Get-ChildItem (Join-Path $fixtures 'data')) {
    $loopFiles += 1
}
Write-Output "loopFiles=$loopFiles"
exit 0
