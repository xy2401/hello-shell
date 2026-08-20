# 演示点：入参解析——$args 全量数组、带空格参数、手工遍历识别选项
if ($args.Count -eq 0) {
    # 无参时自 re-exec：带上含空格参数与选项重新执行自己
    & pwsh -NoProfile -File $PSCommandPath alice 'bob smith' --verbose -n 3
    exit $LASTEXITCODE
}

# 手工遍历 $args：位置参数入列，--verbose 置旗标，-n 吃掉下一个值
$positional = @()
$verboseFlag = $false
$nValue = $null
$i = 0
while ($i -lt $args.Count) {
    $arg = $args[$i]
    if ($arg -eq '--verbose') {
        $verboseFlag = $true
    } elseif ($arg -eq '-n') {
        $i += 1
        $nValue = $args[$i]
    } else {
        $positional += $arg
    }
    $i += 1
}

Write-Output "invocation=$(Split-Path -Leaf $PSCommandPath)"
Write-Output "argCount=$($args.Count)"
Write-Output "firstArg=$($positional[0])"
Write-Output "secondArg=$($positional[1])"
Write-Output "verboseFlag=$($verboseFlag.ToString().ToLower())"
Write-Output "nValue=$nValue"
exit 0
