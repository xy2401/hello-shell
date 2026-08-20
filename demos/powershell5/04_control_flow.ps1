# 04_control_flow: range loop summing, Import-Csv scan, file enumeration
$fixtures = $env:HELLO_SHELL_FIXTURES
$work = Join-Path $env:TEMP 'hello-shell-work'
if (Test-Path $work) { Remove-Item $work -Recurse -Force }
New-Item -ItemType Directory -Path $work | Out-Null

# sum 1..3
$sum = 0
foreach ($i in 1..3) { $sum += $i }
Write-Output "sum123=$sum"

# scan orders.csv and count rows whose status is paid
$paid = 0
foreach ($row in Import-Csv (Join-Path $fixtures 'orders.csv')) {
    if ($row.status -eq 'paid') { $paid += 1 }
}
Write-Output "paidCount=$paid"

# count the files under fixtures\data
$files = 0
foreach ($f in Get-ChildItem (Join-Path $fixtures 'data') -File) { $files += 1 }
Write-Output "loopFiles=$files"
