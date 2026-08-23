# 横向对比矩阵总览

> 本页结论：五个矩阵各自回答一个跨 Shell 的高频问题——入参怎么传（[入参矩阵](/matrix/args-matrix)）、引号怎么界定语义（[引号矩阵](/matrix/quoting-matrix)）、通配符由谁展开（[通配矩阵](/matrix/globbing-matrix)）、错误由谁感知与拦截（[错误处理矩阵](/matrix/error-handling-matrix)）、脚本能否跨发行版/跨平台带走（[可移植性矩阵](/matrix/portability-matrix)）。八个运行体执行同一组 9 个任务，stdout 契约行跨 shell 一致（仅两处例外值，逐处注明）：差异发生在语法路径上，不发生在结果上。

## 八个运行体

| 运行体 | 目录 | 平台 | 版本证据（00_env 快照） |
| --- | --- | --- | --- |
| bash | `demos/bash` | Linux（容器） | `version=GNU bash, version 5.2.37(1)-release (x86_64-pc-linux-musl)` |
| zsh | `demos/zsh` | Linux（容器） | `version=zsh 5.9 (x86_64-alpine-linux-musl)` |
| fish | `demos/fish` | Linux（容器） | `version=fish, version 4.0.2` |
| pwsh（Linux） | `demos/pwsh` | Linux（容器） | `version=PowerShell 7.5.0` |
| cmd | `demos/cmd` | Windows（runner） | `version=Microsoft Windows [Version 10.0.26100.33158]`（`ver` 输出） |
| powershell5 | `demos/powershell5` | Windows（runner） | `version=PowerShell 5.1.26100.33158` |
| powershell7 | `demos/powershell7` | Windows（runner） | `version=PowerShell 7.6.4` |
| python | `demos/python` | Linux（容器，对照组） | `version=Python 3.12.14` |

八个运行体的版本均引自各自 `demos/<shell>/00_env.<ext>.out.txt`（已全部入库）：Linux 侧由 digest 锁定的容器镜像产出，Windows 侧三行由 collect-windows-outputs workflow 在 windows-latest runner 上采集，版本号随 runner 漂移，以快照为准。

## 五大矩阵入口

| 矩阵 | 回答的问题 | 主要证据任务 |
| --- | --- | --- |
| [入参矩阵](/matrix/args-matrix) | 参数怎么交给脚本？脚本名占不占位、从几开始数、怎么数总数、长选项谁来认、带空格参数保不保得住、通配在进脚本前展不展开？ | 03_args_parsing |
| [引号矩阵](/matrix/quoting-matrix) | 单/双引号何时插值、何时字面？怎样阻止分词与通配展开？ | 02_variables_quoting |
| [通配矩阵](/matrix/globbing-matrix) | `*` 由 shell 展开还是命令自己展开？无匹配时发生什么？递归 `**` 谁能用？ | 06_pipes_files |
| [错误处理矩阵](/matrix/error-handling-matrix) | 错误用什么模型感知（退出码 / $status / ERRORLEVEL / 异常）？有没有「遇错即停」开关？错误流怎么分离？ | 01_hello_io、07_errors |
| [可移植性矩阵](/matrix/portability-matrix) | 同一份脚本能跨发行版吗？能跨平台吗？行尾与编码有什么坑？运行体从哪来？ | 00_env、仓库基础设施（.env.versions / Dockerfile / 采集脚本） |

## 同一任务输出契约

9 个统一任务（00_env … 08_real_world）× 8 个运行体 = 72 份实现。每份实现的 **stdout 契约行**固定：同样的键、同样的顺序、同样的值。以任务 03 为例，bash/zsh/fish/pwsh/python/powershell5/powershell7 七个运行体的快照逐字一致：

```text
# demos/bash/03_args_parsing.sh.out.txt（zsh/fish/pwsh/python 快照逐字相同；powershell5/powershell7 仅 invocation= 行的文件名为 03_args_parsing.ps1）
invocation=03_args_parsing.sh
argCount=5
firstArg=alice
secondArg=bob smith
verboseFlag=true
nValue=3
```

唯一随运行体变化的是 `invocation=` 行里的脚本文件名（`03_args_parsing.zsh` / `.fish` / `.ps1` / `.py`）——这是脚本身份，不是任务结果。cmd 是唯一的例外：它的任务 03 快照 invocation 行实测为 `invocation=3`（shift 循环走完后 `%0` 被一并移走），其余五行契约值不变，见[入参矩阵](/matrix/args-matrix)。九个任务的契约行一览：

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

- **契约键一致，个别值随平台合理浮动。** 如 01 的 `childExitCode=`：bash/zsh/fish 容器里的 `ls` 是 busybox 实现，失败退出码为 1；pwsh/python 容器里是 GNU `ls`，退出码为 2；Windows 三体统一为 1——失败命令换成了 `dir`，其失败码就是 1。退出码由命令自身定义、不由 shell 定义——这本身就是[错误处理矩阵](/matrix/error-handling-matrix)的演示点。
- **Windows 侧 27 份快照已全部入库，其中 cmd 有两处契约例外值。** 任务 03 的 `invocation=3`（shift 循环把 `%0` 一并移走，`%~nx0` 没守住脚本名）与任务 06 的 `requestLines=4`（`find` 直读 LF 行尾 fixture 时行为异常，契约值为 2）——两处均已按快照修正矩阵结论。另注意 Windows 采集器（`scripts/collect-windows.ps1`）用 `2>&1` 合并 stderr，因此 Windows 任务 01 快照里**有** stderr 那行，与 Linux 侧恰好互为镜像，见[证据政策](/reference/evidence-policy)。

## 怎么读矩阵页

- 行 = 8 个运行体，列 = 对比维度。
- 八个运行体单元格引用的输出均可在 `demos/<shell>/<任务>.<ext>.out.txt` 逐字复核；引用的脚本写法可在同名源码中复核。
- cmd 快照首行是带提示符的 rem 注释回显（bat 第一行注释先于 `@echo off` 生效），契约行在其后，阅读时跳过即可。

延伸阅读：[统一语义骨架](/concepts/)、[Shell vs Python 边界](/matrix/comparison/shell-vs-python)、[实验说明](/matrix/experiment/)。
