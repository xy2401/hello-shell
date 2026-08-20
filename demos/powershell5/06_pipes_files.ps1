# 06_pipes_files: Get-ChildItem listing, Select-String counting, fixed-order status histogram
$fixtures = $env:HELLO_SHELL_FIXTURES
$data = Join-Path $fixtures 'data'
$work = Join-Path $env:TEMP 'hello-shell-work'
if (Test-Path $work) { Remove-Item $work -Recurse -Force }
New-Item -ItemType Directory -Path $work | Out-Null

# bare sorted names joined with commas
$names = Get-ChildItem $data -File | Sort-Object Name | ForEach-Object { $_.Name }
Write-Output ("globList=" + ($names -join ','))

# count *.log files
$logFiles = @(Get-ChildItem $data -Filter *.log -File).Count
Write-Output "logFiles=$logFiles"

# count lines matching request in app.log
$requestLines = @(Select-String -Path (Join-Path $data 'app.log') -Pattern 'request' -SimpleMatch).Count
Write-Output "requestLines=$requestLines"

# filter paid rows into the scratch dir, then count each status in fixed order
$rows = @(Import-Csv (Join-Path $fixtures 'orders.csv'))
$rows | Where-Object { $_.status -eq 'paid' } | Export-Csv (Join-Path $work 'paid-orders.csv') -NoTypeInformation
$paid = @($rows | Where-Object { $_.status -eq 'paid' }).Count
$pending = @($rows | Where-Object { $_.status -eq 'pending' }).Count
$refunded = @($rows | Where-Object { $_.status -eq 'refunded' }).Count
Write-Output "statusCounts=paid:$paid,pending:$pending,refunded:$refunded"
