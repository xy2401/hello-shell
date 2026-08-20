# PowerShell 入参解析

> 本页结论：PowerShell 的 `$args` 是不含脚本名的纯参数数组——没有 bash `$0` 那样的占位，脚本路径要另从 `$PSCommandPath`/`$MyInvocation` 取；生产脚本应写 `param()` 块获得命名参数，本仓库 demo 为八种实现横向可比，统一采用手工遍历 `$args` 的写法。

## $args：不含脚本名的参数数组

脚本接收的所有参数进入自动变量 `$args`（数组），**第 0 个元素就是第一个
真实参数**，不像 bash 那样 `$0` 先占一个脚本名的位置：

| | bash | PowerShell |
| --- | --- | --- |
| 脚本名 | `$0` | `$PSCommandPath`（另取） |
| 第一个参数 | `$1` | `$args[0]` |
| 参数个数 | `$#` | `$args.Count` |
| 全部参数 | `"$@"` | `$args` |

无参自调用 re-exec 时这个区别一目了然（摘自
`demos/powershell7/03_args_parsing.ps1`）：

```powershell
if ($args.Count -eq 0) {
    # 无参时自 re-exec：带上含空格参数与选项重新执行自己
    & pwsh -NoProfile -File $PSCommandPath alice 'bob smith' --verbose -n 3
    exit $LASTEXITCODE
}
```

带空格的 `'bob smith'` 作为一个元素进入 `$args`，无需像 cmd 那样事后
`%~1` 剥引号。

## 脚本路径：$PSCommandPath 与 $MyInvocation

`$args` 里没有脚本名，要报告「我是谁」得用专门变量：

```powershell
Write-Output "invocation=$(Split-Path -Leaf $PSCommandPath)"
```

- `$PSCommandPath`：当前脚本的完整路径（PS3+ 可用），推荐；
- `$MyInvocation.MyCommand.Path`：老牌等价写法，信息更全（含命令类型），
  在函数/点源（dot-source）场景下语义略有差别。

## 手工遍历 $args：demo 的解析写法

识别 `--verbose` 旗标与 `-n 3` 带值选项（摘自
`demos/powershell7/03_args_parsing.ps1`）：

```powershell
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
```

实测输出（`demos/pwsh/03_args_parsing.ps1.out.txt`，PS7 Linux 快照）：

```text
invocation=03_args_parsing.ps1
argCount=5
firstArg=alice
secondArg=bob smith
verboseFlag=true
nValue=3
```

与 bash/zsh/fish/python 的 03 快照逐行一致（仅 `invocation` 后缀不同）；
`demos/powershell5/03_args_parsing.ps1` 与 `demos/powershell7/` 版同为手工
遍历写法，Windows 侧输出**快照待首次采集**，行为以脚本源码为据。

## param() 块：生产代码的正确姿势

PowerShell 真正的杀手锏是声明式 `param()`——命名参数、类型约束、默认值、
开关旗标一步到位：

```powershell
param(
    [string]$Name,
    [int]$Count = 1,
    [switch]$Verbose   # 调用时写 -Verbose 即为 $true
)
```

调用形如 `.\demo.ps1 -Name alice -Count 3 -Verbose`，还能自动生成
`Get-Help` 文档与参数补全。

**本仓库 demo 为什么不用？** 统一任务矩阵要求八种实现（bash/zsh/fish/
cmd/PS5/PS7/python）用同一种「手工循环解析」算法，才能横向对照各 shell
处理原始参数流的笨拙程度；`param()` 属于 PowerShell 独有的高阶设施，
放在 [入参矩阵](/matrix/args-matrix) 里单独说明。生产 PowerShell 脚本
请优先 `param()`。

## 小结

| 场景 | 写法 |
| --- | --- |
| 取第一个参数 | `$args[0]` |
| 参数个数 | `$args.Count` |
| 脚本自身路径 | `$PSCommandPath` |
| 命名参数/类型/默认值 | `param()` 块（生产推荐） |
| 与其他 shell 对齐的裸解析 | `while` 遍历 `$args`（本仓库 demo） |

动手复现见 [labs](/labs/)。
