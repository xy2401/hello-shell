# 演示点：函数与作用域——函数返回值、子进程退出码、函数内局部变量不外泄
function Get-Answer {
    return 42
}
$result = Get-Answer
Write-Output "functionResult=$result"

# 子 pwsh 进程 exit 7：父进程从 $LASTEXITCODE 拿到退出码
& pwsh -NoProfile -Command 'exit 7'
Write-Output "exitCodeReturn=$LASTEXITCODE"

$globalVar = 'outer'
function Set-InnerVar {
    # 函数内赋值创建的是新的局部变量，不影响外层同名变量
    $globalVar = 'inner'
    $localOnly = 'inside'
}
Set-InnerVar
Write-Output "afterCall=$globalVar"
exit 0
