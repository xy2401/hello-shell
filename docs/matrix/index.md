# 统一语义骨架：所有 Shell 用同一组维度拆解

> 本页结论：bash、zsh、fish、cmd、PowerShell 语法千差万别，但能力骨架是同一套——变量与引用、控制流、函数与管道、错误与信号、入参模型五个维度。本仓库用 9 个统一任务在这五个维度上逐一打桩，每个行为结论都以 `demos/` 下的真实输出快照为证；读结论之前，请先看 [实验总览](/matrix/experiment/#任务-04-控制流)。

## 为什么需要统一骨架

把八个运行体（bash / zsh / fish / pwsh-Linux / cmd / PowerShell 5 / PowerShell 7-Windows / Python 对照）放在一起对比，最怕写成「每个 shell 一章、各说各话」。本站换个组织方式：**先立维度，再谈差异**。任何一个 shell 脚本，都可以用下面五个维度拆解；任何一个统一任务，也都可以映射到一个主维度上。

## 五个维度

| 维度 | 回答的问题 | 专页 |
| --- | --- | --- |
| 变量与引用 | 值怎么存、怎么插值、怎么分词、`*` 会不会变成 glob | [变量与引号](/matrix/quoting-variables) |
| 控制流 | 条件怎么判断、循环怎么写、目录怎么遍历 | [控制流](/matrix/control-flow) |
| 函数与管道 | 函数怎么「返回值」（值还是退出码）、管道里流的是文本还是对象 | [函数与管道](/matrix/functions-pipes) |
| 错误与信号 | 失败之后发生什么：退出码、终止性错误还是异常 | [错误与信号](/matrix/errors-signals) |
| 入参模型 | 脚本名占不占 `$0`/`$args[0]`、长短选项怎么解析、带空格参数怎么保形 | [入参矩阵](/matrix/args-matrix) |

前四个维度各有专页展开；入参模型差异过大（七种 shell 的入参约定互不相同），直接放进横向矩阵 [入参矩阵](/matrix/args-matrix)，实验细节见 [任务 03](/matrix/experiment/#任务-04-控制流#任务-03-入参解析)。

## 9 任务 × 维度映射

9 个统一任务在所有运行体中语义一致：相同的输入（[demos/shared/fixtures](/matrix/experiment/#任务-04-控制流#统一输入)）、相同的验证点、相同格式的 `key=value` 输出行，且全部以退出码 0 收尾——这样输出快照才能逐行对齐比较（见[证据政策](/reference/evidence-policy)）。

| 编号 | 任务 | 主题 | 主维度 | 顺带覆盖 |
| --- | --- | --- | --- | --- |
| 00 | env | 环境指纹：自报版本与平台 | （基线） | 错误与信号（以 `exit 0` 建立基线） |
| 01 | hello_io | stdout/stderr 分流、捕获子进程退出码 | 错误与信号 | — |
| 02 | variables_quoting | 赋值、插值、分词、glob 字面量 | 变量与引用 | — |
| 03 | args_parsing | 位置参数、带空格参数、长短选项 | 入参模型 | 控制流（`while`/`case` 解析循环） |
| 04 | control_flow | `for` 求和、`while` 读 CSV、glob 遍历 | 控制流 | 变量与引用（glob 展开） |
| 05 | functions_scope | 函数返回值、退出码通道、局部作用域 | 函数与管道 | 错误与信号（退出码 7） |
| 06 | pipes_files | glob 列举、`grep`/`cut`/`sort`/`uniq` 管道 | 函数与管道 | 变量与引用、控制流 |
| 07 | errors | 失败捕获、继续执行、子进程退出码 | 错误与信号 | 函数与管道（子进程） |
| 08 | real_world | 复制—改名—校验—报告的批处理 | 全维度综合 | — |

## 输出约定

所有任务脚本遵守同一套输出约定，这是横向对照能够成立的前提：

- 只输出 `key=value` 形式的行，键名跨 shell 一致（如 `wordCount`、`paidCount`、`exitCodeReturn`）；
- 正常路径一律 `exit 0`，非零退出码只出现在故意构造的子进程里（如任务 05 的 `exit 7`）；
- stdout 与 stderr 的分流在任务 01 中专门验证，其余任务不把诊断信息混进 stdout；
- 快照与源码同目录：Linux 五个运行体（bash/zsh/fish/pwsh/python）的 `.out.txt` 已入库，Windows 三个运行体（cmd/powershell5/powershell7）的快照由 CI 采集（见[实验总览](/matrix/experiment/#任务-04-控制流#运行方式)）。

## 下一步

- 按维度读：[变量与引号](/matrix/quoting-variables) → [控制流](/matrix/control-flow) → [函数与管道](/matrix/functions-pipes) → [错误与信号](/matrix/errors-signals)
- 按任务读：[统一任务实验总览](/matrix/experiment/#任务-04-控制流)
- 概念地基（什么是内核、什么是 Shell、什么是 GUI）：[内核 / Shell / GUI](/guide/kernel-shell-gui)
- Shell 与图灵完备语言的能力边界：[Shell vs Python](/matrix/comparison/shell-vs-python)
