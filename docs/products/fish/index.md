# fish 分卷


> 本页结论：fish 是「开箱即用」的现代交互 Shell——语法高亮、自动建议、合理默认一应俱全，但**语法与 POSIX 不兼容**：没有 `$( )`、没有 `done`/`esac`、没有 `$?`，命令替换用括号、一切变量用 `set`、块以 `end` 收尾、退出码读 `$status`。它适合交互与自管工具脚本，不适合直接搬 bash 脚本。本卷全部行为结论来自 alpine 3.22 内装 fish 4.0.2 容器中采集的真实输出快照（`demos/fish/*.out.txt`），学习路径为 [syntax](./syntax) → [args](./args) → [pitfalls](./pitfalls)。

## 一句话定位

**fish = 开箱即用但语法不兼容 POSIX。**

- 交互体验零配置即用，是许多人的日常终端首选；
- 脚本语法自成一派，可读性高（所有块以 `end` 收尾），但 bash/zsh 脚本不能直接拿来跑；
- 与 bash、zsh 的差异，见本目录另外两卷以及 [/matrix/args-matrix](/matrix/args-matrix)。

## 版本基线

快照 `demos/fish/00_env.fish.out.txt`（容器内真实采集）：

```text
version=fish, version 4.0.2
shell=fish
platform=linux
```

- fish 没有官方独立镜像：以 tag+digest 双锁定的 `alpine:3.22` 为基底 `apk add --no-cache fish` 内装（见 `demos/fish/Dockerfile`，基底镜像登记在仓库根 `.env.versions` 的 `ALPINE_IMAGE`）；
- 采集方式：`scripts/run-docker-demos.js` 先构建该 Dockerfile，再在容器内逐个运行 `demos/fish/*.fish`，stdout 写入源码旁同名 `*.out.txt`；
- 快照只收录 stdout：`01_hello_io` 里发往 stderr 的那一行不会出现在快照里。

## 统一任务覆盖（9 任务）

9 个统一任务在 fish 中的脚本与输出快照（快照与源码同目录，位于仓库 `demos/` 内，在线浏览见 [GitHub demos/fish](https://github.com/xy2401/hello-shell/tree/main/demos/fish)）：

| # | 任务 | 脚本 | 输出快照 |
| --- | --- | --- | --- |
| 00 | 环境信息（版本、平台） | `demos/fish/00_env.fish` | `demos/fish/00_env.fish.out.txt` |
| 01 | Hello 与 I/O（stdout/stderr、`$status`） | `demos/fish/01_hello_io.fish` | `demos/fish/01_hello_io.fish.out.txt` |
| 02 | 变量与引用（set、列表、插值） | `demos/fish/02_variables_quoting.fish` | `demos/fish/02_variables_quoting.fish.out.txt` |
| 03 | 入参解析（`$argv`、`status filename`） | `demos/fish/03_args_parsing.fish` | `demos/fish/03_args_parsing.fish.out.txt` |
| 04 | 控制流（for/while、`string match` 过滤） | `demos/fish/04_control_flow.fish` | `demos/fish/04_control_flow.fish.out.txt` |
| 05 | 函数与作用域（return 退出码、`-l` 局部） | `demos/fish/05_functions_scope.fish` | `demos/fish/05_functions_scope.fish.out.txt` |
| 06 | 管道与文件（glob、grep\|wc、列表计数） | `demos/fish/06_pipes_files.fish` | `demos/fish/06_pipes_files.fish.out.txt` |
| 07 | 错误处理（`if not`、失败不中断） | `demos/fish/07_errors.fish` | `demos/fish/07_errors.fish.out.txt` |
| 08 | 综合实战（`string match`、`; and`/`; or`） | `demos/fish/08_real_world.fish` | `demos/fish/08_real_world.fish.out.txt` |

统一输入数据在 `demos/shared/fixtures/`：`orders.csv`（1 表头 + 5 笔订单，其中 3 笔 paid）与 `data/`（`app.log`、`config.csv`、`readme.txt` 三个文件）。fish 九个任务的输出与 bash/zsh 完全一致（如 `paidCount=3`、`statusCounts=paid:3,pending:1,refunded:1`）——同一任务，语法体系完全不同，输出逐行相同，这正是统一任务矩阵的价值。

## 学习路径

1. [语法骨架](./syntax)：`set` 命令、括号命令替换、`end` 收尾的块、`$status`——fish 语法的六块积木；
2. [入参模型](./args)：没有 `$0/$#/$@`，fish 用 `$argv`、`count $argv` 与 `status filename`；
3. [真实陷阱](./pitfalls)：POSIX 不兼容清单、管道子 shell 语义、`$status` 被快速覆盖。

## 相关页面

- [统一任务实验](/matrix/experiments)：如何在本地复现这 9 个任务的采集；
- [内核、Shell 与 GUI](/#shell-foundation)：fish 在三层模型中的位置；
- [Shell vs Python](/matrix/comparison/shell-vs-python)：Shell 脚本的能力边界在哪里。

## 浏览器练习入口

- [语法案例：变量、控制流与文件](./syntax#浏览器实验)
- [入参解析案例](./args#浏览器实验)
- [Fish 管道作用域坑位](./pitfalls#浏览器实验)
