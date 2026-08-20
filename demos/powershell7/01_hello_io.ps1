# 演示点：输出流与退出码——stdout / stderr 分流、子进程退出码 $LASTEXITCODE
Write-Output 'hello from powershell7'
[Console]::Error.WriteLine('this line goes to stderr')

# 运行一个必失败的原生命令，取其非零退出码（cmd dir=1，bash ls=2，具体值随平台）
if ($IsWindows) {
    cmd /c 'dir C:\nonexistent-hello-shell' 2>$null | Out-Null
} else {
    bash -c 'ls /nonexistent-hello-shell' 2>$null | Out-Null
}
Write-Output "childExitCode=$LASTEXITCODE"

Write-Output 'scriptExitCode=0'
exit 0
