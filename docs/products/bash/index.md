# bash 分卷

> 本页结论：bash 是 POSIX 生态的事实标准，也是绝大多数 Linux 服务器与 CI 环境的默认 Shell。本卷全部行为结论来自锁版镜像 `bash:5.2` 容器内采集的真实输出快照（`demos/bash/*.out.txt`），学习路径为 [syntax（语法骨架）](./syntax) → [args（入参模型）](./args) → [pitfalls（真实陷阱）](./pitfalls)。

## 一句话定位

**bash = POSIX 生态事实标准 / 服务器默认。**

- 服务器脚本、CI 脚本、容器入口脚本（`docker-entrypoint.sh`）的默认读者就是 bash；
- 语法是 POSIX sh 的超集，学一次即可在几乎所有 Linux 环境复用；
- 与 zsh、fish 的差异，见本目录另外两卷以及 [/matrix/args-matrix](/matrix/args-matrix)。

## 版本基线

快照 `demos/bash/00_env.sh.out.txt`（容器内真实采集）：

```text
version=GNU bash, version 5.2.37(1)-release (x86_64-pc-linux-musl)
shell=bash
platform=linux
```

- 运行镜像：`bash:5.2`，tag+digest 双锁定，登记在仓库根 `.env.versions`（`BASH_IMAGE=...`）；
- 采集方式：`scripts/run-docker-demos.js` 把 `demos/bash/` 只读挂载进容器，逐个运行脚本，stdout 写入源码旁同名 `*.out.txt`；
- 快照只收录 stdout：`01_hello_io` 里发往 stderr 的那一行不会出现在快照里，这是刻意的流分离设计。

## 统一任务覆盖（9 任务）

9 个统一任务在 bash 中的脚本与输出快照（快照与源码同目录，位于仓库 `demos/` 内，在线浏览见 [GitHub demos/bash](https://github.com/xy2401/hello-shell/tree/main/demos/bash)）：

| # | 任务 | 脚本 | 输出快照 |
| --- | --- | --- | --- |
| 00 | 环境信息（版本、平台） | `demos/bash/00_env.sh` | `demos/bash/00_env.sh.out.txt` |
| 01 | Hello 与 I/O（stdout/stderr、退出码） | `demos/bash/01_hello_io.sh` | `demos/bash/01_hello_io.sh.out.txt` |
| 02 | 变量与引用（分词、插值、glob 安全） | `demos/bash/02_variables_quoting.sh` | `demos/bash/02_variables_quoting.sh.out.txt` |
| 03 | 入参解析（$0/$#/$@、case/shift 循环） | `demos/bash/03_args_parsing.sh` | `demos/bash/03_args_parsing.sh.out.txt` |
| 04 | 控制流（for/while/glob 循环） | `demos/bash/04_control_flow.sh` | `demos/bash/04_control_flow.sh.out.txt` |
| 05 | 函数与作用域（stdout 回值、退出码回状态） | `demos/bash/05_functions_scope.sh` | `demos/bash/05_functions_scope.sh.out.txt` |
| 06 | 管道与文件（glob、cut\|sort\|uniq 管线） | `demos/bash/06_pipes_files.sh` | `demos/bash/06_pipes_files.sh.out.txt` |
| 07 | 错误处理（\|\| 兜底、set -e） | `demos/bash/07_errors.sh` | `demos/bash/07_errors.sh.out.txt` |
| 08 | 综合实战（暂存、批量改名、校验、报表） | `demos/bash/08_real_world.sh` | `demos/bash/08_real_world.sh.out.txt` |

统一输入数据在 `demos/shared/fixtures/`：`orders.csv`（1 表头 + 5 笔订单，其中 3 笔 paid）与 `data/`（`app.log`、`config.csv`、`readme.txt` 三个文件）。这解释了各任务输出中的 `paidCount=3`、`loopFiles=3`、`statusCounts=paid:3,pending:1,refunded:1`。

## 学习路径

1. [语法骨架](./syntax)：变量与引用、条件、循环、函数、管道、错误处理——全部用本仓库 demo 的真实代码与输出讲解；
2. [入参模型](./args)：`$0`/`$#`/`$@` 与 while/case/shift 手工解析循环；
3. [真实陷阱](./pitfalls)：引号缺失分词、set -e 的坑、退出码通道限制。

## 相关页面

- [统一任务实验](/matrix/experiments)：如何在本地复现这 9 个任务的采集；
- [内核、Shell 与 GUI](/#shell-foundation)：bash 在三层模型中的位置；
- [Shell vs Python](/matrix/comparison/shell-vs-python)：bash 脚本的能力边界在哪里。
