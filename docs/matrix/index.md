# 横向对比矩阵总览

> 本页结论：五个矩阵各自回答一个跨 Shell 的高频问题——入参怎么传（[入参矩阵](/matrix/args-matrix)）、引号怎么界定语义（[引号矩阵](/matrix/quoting-matrix)）、通配符由谁展开（[通配矩阵](/matrix/globbing-matrix)）、错误由谁感知与拦截（[错误处理矩阵](/matrix/error-handling-matrix)）、脚本能否跨发行版/跨平台带走（[可移植性矩阵](/matrix/portability-matrix)）。八个运行体执行同一组 9 个任务，stdout 契约行跨 shell 一致：差异发生在语法路径上，不发生在结果上。

## 八个运行体

| 运行体 | 目录 | 平台 | 版本证据（00_env 快照） |
| --- | --- | --- | --- |
| bash | `demos/bash` | Linux（容器） | `version=GNU bash, version 5.2.37(1)-release (x86_64-pc-linux-musl)` |
| zsh | `demos/zsh` | Linux（容器） | `version=zsh 5.9 (x86_64-alpine-linux-musl)` |
| fish | `demos/fish` | Linux（容器） | `version=fish, version 4.0.2` |
| pwsh（Linux） | `demos/pwsh` | Linux（容器） | `version=PowerShell 7.5.0` |
| cmd | `demos/cmd` | Windows（runner） | 脚本输出 `shell=cmd`、`platform=windows`，快照待首次采集 |
| powershell5 | `demos/powershell5` | Windows（runner） | 脚本输出 `shell=powershell5`、`platform=windows`，快照待首次采集 |
| powershell7 | `demos/powershell7` | Windows（runner） | 脚本输出 `shell=powershell7`、`platform=windows`，快照待首次采集 |
| python | `demos/python` | Linux（容器，对照组） | `version=Python 3.12.14` |

Linux 侧版本引自各 `demos/<shell>/00_env.<ext>.out.txt`（已入库）；Windows 侧三行的版本与输出快照由 collect-windows-outputs workflow 在 windows-latest runner 上采集，当前**快照待首次采集**，结论以脚本源码为据。

## 五大矩阵入口

| 矩阵 | 回答的问题 | 主要证据任务 |
| --- | --- | --- |
| [入参矩阵](/matrix/args-matrix) | 参数怎么交给脚本？脚本名占不占位、从几开始数、怎么数总数、长选项谁来认、带空格参数保不保得住、通配在进脚本前展不展开？ | 03_args_parsing |
| [引号矩阵](/matrix/quoting-matrix) | 单/双引号何时插值、何时字面？怎样阻止分词与通配展开？ | 02_variables_quoting |
| [通配矩阵](/matrix/globbing-matrix) | `*` 由 shell 展开还是命令自己展开？无匹配时发生什么？递归 `**` 谁能用？ | 06_pipes_files |
| [错误处理矩阵](/matrix/error-handling-matrix) | 错误用什么模型感知（退出码 / $status / ERRORLEVEL / 异常）？有没有「遇错即停」开关？错误流怎么分离？ | 01_hello_io、07_errors |
| [可移植性矩阵](/matrix/portability-matrix) | 同一份脚本能跨发行版吗？能跨平台吗？行尾与编码有什么坑？运行体从哪来？ | 00_env、仓库基础设施（.env.versions / Dockerfile / 采集脚本） |

## 同一任务输出契约

9 个统一任务（00_env … 08_real_world）× 8 个运行体 = 72 份实现。每份实现的 **stdout 契约行**固定：同样的键、同样的顺序、同样的值。以任务 03 为例，五个 Linux 运行体的快照逐字一致：

```text
# demos/bash/03_args_parsing.sh.out.txt（zsh/fish/pwsh/python 快照逐字相同）
invocation=03_args_parsing.sh
argCount=5
firstArg=alice
secondArg=bob smith
verboseFlag=true
nValue=3
```

唯一随运行体变化的是 `invocation=` 行里的脚本文件名（`03_args_parsing.zsh` / `.fish` / `.ps1` / `.py`）——这是脚本身份，不是任务结果。九个任务的契约行一览：

| 任务 | 契约行（键） |
| --- | --- |
| 00_env | `version=`、`shell=`、`platform=` |
| 01_hello_io | 问候行、`childExitCode=`、`scriptExitCode=0` |
| 02_variables_quoting | `value=`、`wordCount=`、`interpolated=`、`starLiteral=` |
| 03_args_parsing | `invocation=`、`argCount=`、`firstArg=`、`secondArg=`、`verboseFlag=`、`nValue=` |
| 04_control_flow | `sum123=`、`paidCount=`、`loopFiles=` |
| 05_functions_scope | `functionResult=`、`exitCodeReturn=`、`afterCall=` |
| 06_pipes_files | `globList=`、`logFiles=`、`requestLines=`、`statusCounts=` |
| 07_errors | `caughtError=`、`afterFailure=`、`setEExitCode=`、`scriptExitCode=0` |
| 08_real_world | `prepared=`、`renamed=`、`unchanged=`、`verify=`、`report=` |

**差异在语法路径，不在结果。** 以 `wordCount=3` 为例：bash 用 `set -- $words` 靠未加引号展开的分词数出来，zsh 用 `${=words}` 显式分词后数数组，fish 用 `string split` + `count`，pwsh 用 `-split` 运算符，cmd 用 `for %%w` 分词器——五条完全不同的语法路径，落到同一个契约值。各矩阵页会逐维度展开这类对照。

两点诚实声明：

- **契约键一致，个别值随平台合理浮动。** 如 01 的 `childExitCode=`：bash/zsh/fish 容器里的 `ls` 是 busybox 实现，失败退出码为 1；pwsh/python 容器里是 GNU `ls`，退出码为 2。退出码由命令自身定义、不由 shell 定义——这本身就是[错误处理矩阵](/matrix/error-handling-matrix)的演示点。
- **Windows 侧快照待首次采集。** cmd / powershell5 / powershell7 的 `*.out.txt` 尚未入库，矩阵中这三行以脚本源码（`demos/cmd/*.bat`、`demos/powershell5/*.ps1`、`demos/powershell7/*.ps1`）为据并逐处标注，见[证据政策](/reference/evidence-policy)。

## 怎么读矩阵页

- 行 = 8 个运行体，列 = 对比维度。
- Linux 侧单元格引用的输出均可在 `demos/<shell>/<任务>.<ext>.out.txt` 逐字复核；引用的脚本写法可在同名源码中复核。
- Windows 侧单元格标注「快照待首次采集」的，依据是脚本源码而非运行输出。

延伸阅读：[统一语义骨架](/fundamentals/)、[Shell vs Python 边界](/compare/shell-vs-python)、[实验说明](/labs/)。
