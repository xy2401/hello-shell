# zsh 分卷


> 本页结论：zsh 是「交互增强 + 大体兼容 bash」的 POSIX 系 Shell，也是 macOS 自 Catalina 起的默认登录 Shell。它默认不对变量展开分词、数组下标从 1 开始、glob 带限定符，这三点正是与 bash 的主要差异。本卷全部行为结论来自 alpine 3.22 内装 zsh 5.9 容器中采集的真实输出快照（`demos/zsh/*.out.txt`），学习路径为 [syntax](./syntax) → [args](./args) → [pitfalls](./pitfalls)。

## 一句话定位

**zsh = 交互增强 + macOS 默认。**

- 日常交互体验（补全、主题、插件生态）是它的主场，macOS 终端的默认 Shell；
- 脚本语法大体兼容 bash，但默认不分词、数组从 1 开始、`status` 是保留字——直接照搬 bash 习惯会踩坑，见 [真实陷阱](./pitfalls)；
- 与 bash、fish 的差异，见本目录另外两卷以及 [/matrix/args-matrix](/matrix/args-matrix)。

## 版本基线

快照 `demos/zsh/00_env.zsh.out.txt`（容器内真实采集）：

```text
version=zsh 5.9 (x86_64-alpine-linux-musl)
shell=zsh
platform=linux
```

- zsh 没有官方独立镜像：以 tag+digest 双锁定的 `alpine:3.22` 为基底 `apk add --no-cache zsh` 内装（见 `demos/zsh/Dockerfile`，基底镜像登记在仓库根 `.env.versions` 的 `ALPINE_IMAGE`）；
- 采集方式：`scripts/run-docker-demos.js` 先构建该 Dockerfile，再在容器内逐个运行 `demos/zsh/*.zsh`，stdout 写入源码旁同名 `*.out.txt`；
- 快照只收录 stdout：`01_hello_io` 里发往 stderr 的那一行不会出现在快照里。

## 统一任务覆盖（9 任务）

9 个统一任务在 zsh 中的脚本与输出快照（快照与源码同目录，位于仓库 `demos/` 内，在线浏览见 [GitHub demos/zsh](https://github.com/xy2401/hello-shell/tree/main/demos/zsh)）：

| # | 任务 | 脚本 | 输出快照 |
| --- | --- | --- | --- |
| 00 | 环境信息（版本、平台） | `demos/zsh/00_env.zsh` | `demos/zsh/00_env.zsh.out.txt` |
| 01 | Hello 与 I/O（stdout/stderr、退出码） | `demos/zsh/01_hello_io.zsh` | `demos/zsh/01_hello_io.zsh.out.txt` |
| 02 | 变量与引用（默认不分词、`${=var}`、下标从 1） | `demos/zsh/02_variables_quoting.zsh` | `demos/zsh/02_variables_quoting.zsh.out.txt` |
| 03 | 入参解析（$0/$#/$@、case/shift 循环） | `demos/zsh/03_args_parsing.zsh` | `demos/zsh/03_args_parsing.zsh.out.txt` |
| 04 | 控制流（for/while、管道尾部落回当前 shell） | `demos/zsh/04_control_flow.zsh` | `demos/zsh/04_control_flow.zsh.out.txt` |
| 05 | 函数与作用域（stdout 回值、退出码回状态） | `demos/zsh/05_functions_scope.zsh` | `demos/zsh/05_functions_scope.zsh.out.txt` |
| 06 | 管道与文件（数组接 glob、修饰符、join） | `demos/zsh/06_pipes_files.zsh` | `demos/zsh/06_pipes_files.zsh.out.txt` |
| 07 | 错误处理（\|\| 兜底、set -e） | `demos/zsh/07_errors.zsh` | `demos/zsh/07_errors.zsh.out.txt` |
| 08 | 综合实战（glob 限定符 (N)(.)、批量改名、校验） | `demos/zsh/08_real_world.zsh` | `demos/zsh/08_real_world.zsh.out.txt` |

统一输入数据在 `demos/shared/fixtures/`：`orders.csv`（1 表头 + 5 笔订单，其中 3 笔 paid）与 `data/`（`app.log`、`config.csv`、`readme.txt` 三个文件）。zsh 九个任务的输出与 bash 完全一致（如 `paidCount=3`、`statusCounts=paid:3,pending:1,refunded:1`），差异都在**写法**上——这正是本卷的主题。

## 学习路径

1. [语法骨架](./syntax)：与 bash 同构的六块积木，以及 zsh 的独特处（默认不分词、下标从 1、glob 限定符）；
2. [入参模型](./args)：同样用 `$0/$#/$@`，但数组取值下标从 1 开始；
3. [真实陷阱](./pitfalls)：分词差异、`status` 保留字、NOMATCH 与 `(N)`。

## 相关页面

- [统一任务实验](/matrix/experiments)：如何在本地复现这 9 个任务的采集；
- [内核、Shell 与 GUI](/#shell-foundation)：zsh 在三层模型中的位置；
- [Shell vs Python](/matrix/comparison/shell-vs-python)：Shell 脚本的能力边界在哪里。

## 浏览器练习入口

- [语法案例：变量、控制流与文件](./syntax#浏览器实验)
- [入参解析案例](./args#浏览器实验)
- [Zsh NOMATCH 坑位](./pitfalls#浏览器实验)
