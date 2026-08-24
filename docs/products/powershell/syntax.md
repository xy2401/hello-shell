# PowerShell 语法基础

> 本页结论：PowerShell 语法围绕对象管道展开——cmdlet 之间传对象、`$_` 指代当前对象；`$变量` 双引号插值、单引号字面量；函数有真正的返回值；try/catch 只接得住「终止性错误」，要靠 `-ErrorAction Stop` 或 `$ErrorActionPreference='Stop'` 升级。片段摘自 `demos/powershell7/`，输出对照 `demos/pwsh/` 快照（PS7 Linux 实测）；Windows 侧 `demos/powershell5/` 与 `demos/powershell7/` 的对应快照也已落库，且本页涉及的 02/05/06/07 四个任务均与 Linux 版逐行一致。

## 对象管道：Get-ChildItem | … | Measure-Object

管道每一段输出的是对象，下一段直接按属性过滤/统计，不需要 `awk`/`cut`
式的文本切分（摘自 `demos/powershell7/06_pipes_files.ps1`）：

```powershell
# Get-ChildItem | Sort-Object：按名排序后拼成逗号列表
$names = Get-ChildItem $dataDir | Sort-Object Name | ForEach-Object { $_.Name }
Write-Output "globList=$($names -join ',')"

# -Filter 通配符只留 .log 文件，Measure-Object 数个数
$logFiles = (Get-ChildItem $dataDir -Filter *.log | Measure-Object).Count
Write-Output "logFiles=$logFiles"
```

`$_` 是管道当前对象的自动变量；`.Count`、`.Name` 直接取属性。
CSV 更典型——`Import-Csv` 把每行变成带列属性的对象，`Group-Object`
按列分组计数（同文件）：

```powershell
$groups = Import-Csv (Join-Path $fixtures 'orders.csv') | Group-Object status
$parts = foreach ($key in @('paid', 'pending', 'refunded')) {
    $group = $groups | Where-Object { $_.Name -eq $key }
    "${key}:$($group.Count)"
}
Write-Output "statusCounts=$($parts -join ',')"
```

对应快照 `demos/pwsh/06_pipes_files.ps1.out.txt`：

```text
globList=app.log,config.csv,readme.txt
logFiles=1
requestLines=2
statusCounts=paid:3,pending:1,refunded:1
```

`demos/powershell5/` 与 `demos/powershell7/` 下的同名 Windows 快照
与此逐行相同——对象管道语义在两代 Windows PowerShell 上无差异。

全程没有一处正则切分字符串——这就是「对象管道」相对文本管道的优势。

## $变量与引号

赋值即声明，`$` 前缀引用（摘自 `demos/powershell7/02_variables_quoting.ps1`）：

```powershell
$value = 'hello world'
$answer = 42
# 双引号：$answer 被插值成 42
$interpolated = "value-is-$answer"
# 单引号：a*b*c 原样保留（是字面量，不是通配符）
$starLiteral = 'a*b*c'
# -split 按正则拆分并计数：'\*' 转义星号，拆出 a/b/c 三段
$wordCount = ($starLiteral -split '\*').Count
```

规则两条：**双引号插值、单引号原样**；通配符与 glob 只发生在 cmdlet
参数位置（如 `-Filter *.log`），字符串里的 `*` 永远是普通字符。
快照 `demos/pwsh/02_variables_quoting.ps1.out.txt`：

```text
value=hello world
wordCount=3
interpolated=value-is-42
starLiteral=a*b*c
```

复杂表达式插值要包 `$()`：`"globList=$($names -join ',')"`。

## 函数：真正的返回值与作用域

（摘自 `demos/powershell7/05_functions_scope.ps1`）：

```powershell
function Get-Answer {
    return 42
}
$result = Get-Answer
Write-Output "functionResult=$result"

$globalVar = 'outer'
function Set-InnerVar {
    # 函数内赋值创建的是新的局部变量，不影响外层同名变量
    $globalVar = 'inner'
}
Set-InnerVar
Write-Output "afterCall=$globalVar"
```

函数返回任意对象（不限于退出码）；函数内赋值默认创建局部变量，外层
同名变量不受影响。快照 `demos/pwsh/05_functions_scope.ps1.out.txt`：

```text
functionResult=42
exitCodeReturn=7
afterCall=outer
```

对照：cmd 的「函数」只有 label + 环境变量传值（见
[cmd 语法基础](/products/cmd/syntax)），这是两代 shell 的代差。

## try/catch 与 $ErrorActionPreference

PowerShell 把错误分两类：**非终止性**（打印错误后继续，默认行为）与
**终止性**（中断执行）。try/catch 只接得住终止性错误，所以要显式升级
（摘自 `demos/powershell7/07_errors.ps1`）：

```powershell
$caughtError = $false
try {
    # -ErrorAction Stop 把"文件不存在"升级为终止性错误，才能被 catch 捕获
    Get-Content -Path '/nonexistent-hello-shell' -ErrorAction Stop | Out-Null
} catch {
    $caughtError = $true
}
Write-Output "caughtError=$($caughtError.ToString().ToLower())"
```

两种升级手段：

- 单条命令：`-ErrorAction Stop` 参数；
- 整个作用域：`$ErrorActionPreference = 'Stop'` 自动变量。

demo 的「set -e 等价物」就是后者——放进子 pwsh 里跑，未捕获的终止性
错误让子进程非零退出，父进程读 `$LASTEXITCODE`（同文件）：

```powershell
& pwsh -NoProfile -Command '$ErrorActionPreference=''Stop''; Get-Content -Path /nonexistent-hello-shell | Out-Null' > $null 2> $null
Write-Output "setEExitCode=$LASTEXITCODE"
```

快照 `demos/pwsh/07_errors.ps1.out.txt`：

```text
caughtError=true
afterFailure=continued
setEExitCode=1
scriptExitCode=0
```

注意 catch 之后脚本照常继续——PowerShell 没有 bash `set -e` 那种全局
「遇错即停」开关，失败策略是逐点声明的。`$LASTEXITCODE` 为何只反映
子进程、不反映 cmdlet 失败，见 [常见陷阱](/products/powershell/pitfalls)；
各 shell 错误模型对照见 [错误处理矩阵](/matrix/error-handling-matrix)。

## 浏览器实验

PowerShell 暂不在浏览器内执行；运行体下拉仍可切换 Linux pwsh、Windows PowerShell 5.1 与 PowerShell 7 的仓库快照。

<ShellLessonTrigger case-id="task-02" variant="powershell7" label="载入变量与引号" />
<ShellLessonTrigger case-id="task-06" variant="powershell7" label="载入对象管道" />
<ShellLessonTrigger case-id="task-07" variant="powershell7" label="载入错误处理" />

<ShellLessonLab :case-ids="['task-02', 'task-06', 'task-07']" default-variant="powershell7" />
