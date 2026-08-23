# 入参矩阵：八个运行体如何接收脚本参数

> 本页结论：八个运行体在「第一个位置参数从 1 开始、带空格参数靠引号保住、长选项一律不原生支持」这三点上殊途同归——任务 03 传入 `alice "bob smith" --verbose -n 3`，七份快照（bash/zsh/fish/pwsh/python/powershell5/powershell7）全部给出 `argCount=5`、`secondArg=bob smith`、`verboseFlag=true`、`nValue=3`，cmd 快照同给这四值、仅 invocation 行例外（实测 `invocation=3`）。真正的分野在语法路径：bash/zsh 的 `$0` 占掉脚本名、`$1` 起是参数；fish 的 `$argv` 干脆不含脚本名；PowerShell 的 `$args` 也不含脚本名、脚本名另走 `$PSCommandPath`；cmd 用 `%0`/`%1` 分离；python 的 `sys.argv[0]` 是脚本名。长选项所有 shell 都不原生认 `--long`，统一靠手工循环解析。

## 统一实验

任务 03 无参时自 re-exec，带上同一组参数重新执行自己：

```text
<脚本> alice "bob smith" --verbose -n 3
```

五个 Linux 运行体的快照逐字一致（除 `invocation=` 行的文件名）：

```text
# demos/bash/03_args_parsing.sh.out.txt（demos/zsh、demos/fish、demos/pwsh、demos/python 快照逐字相同）
invocation=03_args_parsing.sh
argCount=5
firstArg=alice
secondArg=bob smith
verboseFlag=true
nValue=3
```

Windows 侧快照已入库：powershell5/powershell7 两份快照与上图逐字一致（仅 `invocation=03_args_parsing.ps1`）；cmd 快照的 `argCount=5`、`firstArg=alice`、`secondArg=bob smith`、`verboseFlag=true`、`nValue=3` 五行同样吻合，唯独 invocation 行实测为 `invocation=3`——详见下文「脚本名占位」一节。

## 入参六维对照

| 运行体 | 脚本名占位符 | 位置参数起点 | 参数总数获取 | 长选项原生支持 | 带空格参数保留 | 展开/通配时机 |
| --- | --- | --- | --- | --- | --- | --- |
| bash | `$0`（`${0##*/}` 取文件名） | `$1` 即第 1 个参数 | `$#` | 无；`while`+`case`+`shift` 手工循环 | 调用侧 `"bob smith"` 原样进 `$2` | shell 在命令执行前完成变量展开与通配展开 |
| zsh | `$0`（同 bash） | `$1` 即第 1 个参数（注意 zsh 数组 1 基） | `$#` | 无；同 bash 手工循环 | 同 bash | 同 bash |
| fish | `$argv` **不含**脚本名，脚本名用 `status filename` 另取 | `$argv[1]` 即第 1 个参数（1 基） | `count $argv` | 无；`while` 手工循环 | 同 bash | shell 展开，同 bash |
| pwsh（Linux） | `$args` **不含**脚本名，脚本名用 `$PSCommandPath` 另取 | `$args[0]` 即第 1 个参数（0 基数组） | `$args.Count` | 无 `--long`；本任务手工 `while` 遍历（`param()` 命名参数另述） | `'bob smith'` 原样进 `$args[1]` | shell 不做命令行通配展开，交给 cmdlet 的通配参数 |
| cmd | `%0` 是脚本名，与 `%1` 分离；但快照实测 shift 循环走完后 `%0` 被一并移走，`%~nx0` 落成 `invocation=3` | `%1` 即第 1 个参数 | 无内建计数；`%*` 为全体参数原文，计数靠 `shift` 循环 | 无；`goto` 循环手工识别 | `"bob smith"` 保留，`%~2` 去引号取用（快照 `secondArg=bob smith`） | shell 不展开通配，`dir`/`for` 自行处理 |
| powershell5 | `$args` 不含脚本名；`$PSCommandPath` | `$args[0]` | `$args.Count` | 无 `--long`；手工 `for` 遍历（`param()` 另述） | `'bob smith'` 原样（快照 `secondArg=bob smith`） | 同 pwsh |
| powershell7 | `$args` 不含脚本名；`$PSCommandPath` | `$args[0]` | `$args.Count` | 无 `--long`；手工 `while` 遍历（`param()` 另述） | `'bob smith'` 原样（快照 `secondArg=bob smith`） | 同 pwsh |
| python | `sys.argv[0]` 是脚本名（`os.path.basename` 取文件名） | `sys.argv[1]` 即第 1 个参数 | `len(sys.argv) - 1` | 本任务手工 `while` 循环；标准库 `argparse` 可认长选项，但那是库不是 shell 机制 | 引号由外层 shell 消化，进程收到的 argv 天然保住空格 | 无 shell 层展开；通配需显式调 `glob` 模块 |

## 逐维度证据

### 脚本名占位：四种流派

bash/zsh 把脚本名放在 `$0`，参数从 `$1` 开始数（摘自 `demos/bash/03_args_parsing.sh`）：

```bash
echo "invocation=${0##*/}"
```

fish 的 `$argv` 里没有脚本名这一项，要用 `status filename` 单独取（摘自 `demos/fish/03_args_parsing.fish`）：

```fish
exec fish (status filename) alice "bob smith" --verbose -n 3
set -l script_name (string replace -r '.*/' '' (status filename))
```

PowerShell 的 `$args` 同样不含脚本名，脚本名走 `$PSCommandPath`（摘自 `demos/pwsh/03_args_parsing.ps1`）：

```powershell
Write-Output "invocation=$(Split-Path -Leaf $PSCommandPath)"
```

cmd 最直白：`%0` 就是脚本自身，与参数槽位 `%1` 起完全分离（摘自 `demos/cmd/03_args_parsing.bat`）：

```bat
call "%~f0" alice "bob smith" --verbose -n 3
...
echo invocation=%~nx0
```

但 cmd 的快照给出了唯一一处与源码推断不符的结果：invocation 行实测为 `invocation=3`，而不是脚本文件名。原因是 re-exec 子进程里 shift 循环走完五个参数后，`%0` 也被一并移走、只剩最后一个参数 `3`，`%~nx0` 便取不到脚本名了。此处以快照为准修正：cmd 的 `%0`「名义上是脚本名」，在带 shift 循环的场景里并不可靠；其余七个运行体的 invocation 行都稳稳打出脚本文件名。

python 介于两者之间：`sys.argv[0]` 占掉脚本名，所以总数要减一（摘自 `demos/python/03_args_parsing.py`）：

```python
script_name = os.path.basename(sys.argv[0])
print(f"argCount={len(argv)}")   # argv 已是 sys.argv[1:]
```

七份快照的 `invocation=` 行是各自写法的直接产物：`03_args_parsing.sh` / `.zsh` / `.fish` / `.ps1` / `.py`，与 `argCount=5` 并列出现；cmd 的 `invocation=3` 是八体中唯一的例外。

### 参数总数：`$#`、`count $argv`、`$args.Count`、循环计数

bash/zsh 一个符号 `$#` 搞定，`argCount=$#` 直接打出 `argCount=5`。fish 用 `count $argv`（摘自 `demos/fish/03_args_parsing.fish`）：

```fish
echo "argCount="(count $argv)
```

PowerShell 用数组属性 `$args.Count`（摘自 `demos/powershell7/03_args_parsing.ps1`）：

```powershell
Write-Output "argCount=$($args.Count)"
```

cmd 没有内建计数——`%*` 只是全体参数的原文串，想知道个数只能 `shift` 循环里手工累加（摘自 `demos/cmd/03_args_parsing.bat`）：

```bat
set "ARGC=0"
:loop
if "%~1"=="" goto done
...
set /a ARGC+=1
shift
goto loop
```

### 长选项：全员手工循环，PowerShell 的 `param()` 另述

`--verbose` 在八个运行体里没有一个被「原生」识别，全部是逐参数比对的手工循环。bash/zsh 是 `while [ "$#" -gt 0 ]` + `case`：

```bash
while [ "$#" -gt 0 ]; do
  case "$1" in
    --verbose) verboseFlag=true; shift ;;
    -n)        nValue="$2"; shift 2 ;;
    *)         positional+=("$1"); shift ;;
  esac
done
```

（摘自 `demos/bash/03_args_parsing.sh`，zsh 版仅数组下标改为 1 基。）快照中 `verboseFlag=true`、`nValue=3` 即此循环的产物。

PowerShell 另有 `param()` 块提供 `-Name value` 式**命名参数**与自动绑定，但它认的是 PowerShell 风格的短名，不是 GNU 风格 `--long`；且本任务为了与其余运行体同构，刻意不用 `param()`，直接遍历 `$args`（powershell5 用 `for`、powershell7 与 pwsh 同用 `while`）。cmd 的等价物是 `goto` 循环加字符串比较（`if "%~1"=="--verbose"`）。八份快照的 `verboseFlag=true`、`nValue=3` 证明这些手工循环殊途同归。

### 带空格参数：`secondArg=bob smith` 全票通过

`"bob smith"` 在八份快照里都原样落成一行 `secondArg=bob smith`——空格没有被任何一家的参数传递机制拆散。各家的保命写法：bash/zsh/fish 调用侧加双引号；PowerShell 用单引号 `'bob smith'`；cmd 调用侧双引号、取用时 `%~2` 去引号（`set "SECOND=%~2"`）；python 无需操心，引号由外层 shell 消化，进程 argv 本身就是按参数切好的数组。

### 展开/通配时机：进脚本之前还是之后

bash/zsh/fish 在把参数交给命令**之前**就完成变量替换与通配展开——命令行里写 `*.log`，脚本收到的是已展开的文件名列表。PowerShell 与 cmd 的命令行不做通配展开：PowerShell 把 `*` 原样交给 cmdlet 的通配参数（如 `Get-ChildItem -Filter *.log`），cmd 交给 `dir`/`for` 自行处理。python 的 `sys.argv` 原样接收，通配需显式调用 `glob` 模块。对照细节见[通配矩阵](/matrix/globbing-matrix)。

## 小结

| 结论 | 证据 |
| --- | --- |
| 第一位置参数即第一个用户参数（脚本名不占位置参数槽） | bash `$1`、fish `$argv[1]`、PS `$args[0]`、cmd `%1`、python `sys.argv[1]`；八份快照 `firstArg=alice` |
| 参数总数各家一行代码，cmd 例外需循环 | `$#` / `count $argv` / `$args.Count` / `ARGC` 循环；八份快照 `argCount=5` |
| `--long` 无一家原生支持 | 八份任务 03 脚本全部是手工比对循环，快照 `verboseFlag=true`、`nValue=3` 全票一致 |
| 带空格参数全员保得住 | 八份快照 `secondArg=bob smith`（cmd 靠 `%~2` 去引号、PS 靠单引号实参，均经快照验证） |
| cmd 的 `%~nx0` 在 shift 循环后守不住脚本名 | cmd 任务 03 快照实测 `invocation=3`，八体唯一例外（源码推断为脚本文件名，以快照为准修正） |

延伸阅读：[bash 入参](/products/bash/args)、[zsh 入参](/products/zsh/args)、[fish 入参](/products/fish/args)、[cmd 入参](/products/cmd/args)、[PowerShell 入参](/products/powershell/args)、[[入参矩阵](/matrix/args-matrix)。
