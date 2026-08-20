# 演示点：错误处理——try/catch 捕获终止性错误、脚本继续执行、子进程失败退出码
$caughtError = $false
try {
    # -ErrorAction Stop 把"文件不存在"升级为终止性错误，才能被 catch 捕获
    Get-Content -Path '/nonexistent-hello-shell' -ErrorAction Stop | Out-Null
} catch {
    $caughtError = $true
}
Write-Output "caughtError=$($caughtError.ToString().ToLower())"

# catch 之后脚本照常继续，不会像 bash 的 set -e 那样中断
Write-Output 'afterFailure=continued'

# 子进程内 $ErrorActionPreference='Stop'：未捕获的终止性错误使子 pwsh 以非零码退出
& pwsh -NoProfile -Command '$ErrorActionPreference=''Stop''; Get-Content -Path /nonexistent-hello-shell | Out-Null' > $null 2> $null
Write-Output "setEExitCode=$LASTEXITCODE"

Write-Output 'scriptExitCode=0'
exit 0
