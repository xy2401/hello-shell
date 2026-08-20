# 02_variables_quoting: single-quoted literals, -split token counting, string interpolation
$work = Join-Path $env:TEMP 'hello-shell-work'
if (Test-Path $work) { Remove-Item $work -Recurse -Force }
New-Item -ItemType Directory -Path $work | Out-Null

$value = 'hello world'
Write-Output "value=$value"
# count the tokens of "$value cmd" = 3 words
$words = "$value cmd"
$wordCount = @($words -split '\s+').Count
Write-Output "wordCount=$wordCount"
$num = 42
Write-Output "interpolated=value-is-$num"
$star = 'a*b*c'
Write-Output "starLiteral=$star"
