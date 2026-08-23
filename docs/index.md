---
layout: home

hero:
  name: "🔧 Hello Shell"
  text: "Shell 命令与脚本统一知识库"
  tagline: "8 大运行体 · 9 个统一任务 · 双平台真实采集 · 横向能力对比矩阵"
  image: /logo.svg
  alt: Hello Shell - Shell 命令学习平台
  actions:
    - theme: brand
      text: 基础概念
      link: /matrix/
    - theme: alt
      text: 🎯 实验总览
      link: /matrix/experiment/
    - theme: alt
      text: ⚖️ 横向对比矩阵
      link: /matrix/

features:
  - icon: 🏗️
    title: 统一语义骨架
    details: 所有 Shell 的八大核心语义：**命令执行、管道传递、重定向输出、变量引用、位置参数、错误处理、循环条件、函数作用域**——理解本质再深入细节。
  - icon: 🔬
    title: 真实输出快照
    details: 9 个统一任务 × 8 个运行体，同一份输入、同一组验证点、同样的 `key=value` 输出行；Linux 侧容器化（tag+digest 双锁），Windows 侧 CI 原生采集。
  - icon: 🌍
    title: 双平台对照
    details: Linux bash/zsh/fish/pwsh + Windows cmd/PowerShell 5/7，跨平台差异以真实输出为证：大小写敏感、通配匹配、退出码语义。
  - icon: 🐍
    title: Shell vs Python
    details: 同一任务的 Shell/Python 对照实现，划清 Shell「方便但不适合」的场景：复杂字符串、数据结构、跨平台、错误处理。
---

## 🎯 典型 Shell 快速入口

全部 5 个 Linux/Windows Shell 全部平铺可点击！

| Shell | 平台 | 类型 | 核心价值 | 分卷文档 |
| :--- | :--- | :--- | :--- | --- |
| [Bash](/products/bash/) 💻 | Linux/macOS | GNU Shell | POSIX 标准参考实现、默认命令行环境、脚本万能钥匙 | [查看详情](/products/bash/) → |
| [zsh](/products/zsh/) 🐚 | Linux/macOS | Enhanced Bash | 插件系统 (Oh My Zsh)、自动纠错、补全增强、主题美化 | [查看详情](/products/zsh/) → |
| [fish](/products/fish/) 🐟 | Linux/macOS | Friendly Shell | 语法最简洁、交互体验最佳、新手友好、智能提示 | [查看详情](/products/fish/) → |
| [cmd](/products/cmd/) 💿 | Windows | Legacy CLI | Windows 传统命令行、批处理脚本 (.bat/.cmd)、兼容性最强 | [查看详情](/products/cmd/) → |
| [PowerShell](/products/powershell/) ☁️ | Windows/macOS/Linux | Object Pipeline | 面向对象管道、强大对象操作、跨平台 (Core 7+)、自动化神器 | [查看详情](/products/powershell/) → |

<div class="grid-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-top: 24px;">

<a href="/matrix/experiment/" style="text-decoration: none;">
  <div style="background: var(--vp-c-bg-soft); border: 1px solid var(--vp-c-divider); padding: 20px; border-radius: 12px; height: 100%; transition: all 0.3s ease;">
    <h3 style="margin: 0 0 8px 0; color: var(--vp-c-brand-1);">📝 9 个统一任务实验手册</h3>
    <p style="margin: 0; font-size: 0.875rem; color: var(--vp-c-text-2);">env 环境指纹 → hello_io → variables_quoting → args_parsing → control_flow → functions_scope → pipes_files → errors → real_world 完整批处理流水线</p>
  </div>
</a>

<a href="/matrix/" style="text-decoration: none;">
  <div style="background: var(--vp-c-bg-soft); border: 1px solid var(--vp-c-divider); padding: 20px; border-radius: 12px; height: 100%; transition: all 0.3s ease;">
    <h3 style="margin: 0 0 8px 0; color: var(--vp-c-brand-1);">⚖️ 5 大横向对比矩阵</h3>
    <p style="margin: 0; font-size: 0.875rem; color: var(--vp-c-text-2);">入参模型、引号语义、通配匹配、错误处理、可移植性五大维度深度对比表</p>
  </div>
</a>

<a href="/compare/shell-vs-python" style="text-decoration: none;">
  <div style="background: var(--vp-c-bg-soft); border: 1px solid var(--vp-c-divider); padding: 20px; border-radius: 12px; height: 100%; transition: all 0.3s ease;">
    <h3 style="margin: 0 0 8px 0; color: var(--vp-c-brand-1);">🐍 Shell vs Python 边界分析</h3>
    <p style="margin: 0; font-size: 0.875rem; color: var(--vp-c-text-2);">什么场景该用 Shell？何时切换到 Python？语言互补性与能力边界详解</p>
  </div>
</a>

</div>

---

## 🧪 统一任务实验速览

9 个统一任务覆盖从最简单的环境查询到复杂的批处理流水线，每个任务的真实输出已入库：

| 编号 | 任务名称 | 验证点 | 示例输出 |
| :--- | :--- | :--- | :--- |
| 00 | **env** | 自报版本与平台 (`version`/`shell`/`platform`) | `version=GNU bash, version 5.2.37(1)-release`<br>`shell=bash`<br>`platform=linux` |
| 01 | **hello_io** | stdout/stderr 分流、捕获子进程非零退出码 | `stdout: hello from bash`<br>`childExitCode=1`<br>`scriptExitCode=0` |
| 02 | **variables_quoting** | 带空格赋值、分词计数、插值、`*` 保持字面 | `value=hello world`<br>`wordCount=3`<br>`starLiteral=a*b*c` |
| 03 | **args_parsing** | 位置参数、带空格参数、长短选项解析 | `invocation=03_args_parsing.sh`<br>`secondArg=bob smith`<br>`verboseFlag=true` |
| 04 | **control_flow** | for 求和、CSV 过滤、glob 遍历计数 | `sum123=6`<br>`paidCount=3`<br>`loopFiles=3` |
| 05 | **functions_scope** | 函数返回值、退出码通道、局部作用域 | `functionResult=42`<br>`exitCodeReturn=7`<br>`afterCall=outer` |
| 06 | **pipes_files** | glob 列举、通配计数、grep 行数、分组统计 | `globList=app.log,config.csv,readme.txt`<br>`statusCounts=paid:3,pending:1,refunded:1` |
| 07 | **errors** | 捕获失败继续执行、`set -e` 类退出码 | `caughtError=true`<br>`afterFailure=continued`<br>`setEExitCode=1` |
| 08 | **real_world** | 复制—改名—校验—报告批处理流水线 | `prepared=3,renamed=1,unchanged=2,verify=ok` |

完整的实验说明、运行方式与证据采信规则见 [实验总览](/matrix/experiment/)。

---

## 🔄 内核、Shell 与 GUI 的关系

Shell 不是编程语言，而是**命令解释器**。理解 Shell 的本质，首先要理解它与内核、GUI 的层次关系：

```mermaid
graph LR
  Kernel[🔷 内核 Kernel] --> Shell[👩‍💻 Shell<br/>文本模式用户界面]
  Kernel --> GUI[🖼️ GUI<br/>图形化用户界面]
  Shell --> User[👤 终端用户]
  GUI --> User
```

- **内核**: 资源管理者（CPU、内存、文件、网络）
- **Shell**: 命令解释器（文本命令 → 内核 API 调用）
- **GUI**: 图形化 Shell（鼠标点击/拖拽 → 系统调用）

详见 [内核、Shell、GUI 三层概念](https://github.com/xy2401/hello-shell)。

---

## 📊 横向对比矩阵速览

各 Shell 在关键功能上的支持方式不同——「原生」不等于「简单」，「兼容标准」也不等于「易用」。

| 特性 | Bash | zsh | fish | cmd | PowerShell |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **数组支持** | 基本 (`arr=(...)`) | 增强 (`arr=()`) | 原生 (`set arr a b c`) | 无 | 对象数组 (`@()`) |
| **通配匹配** | 严格 | 严格 + 扩展 | 正则风格 | 大小写不敏感 | 支持 `-like` `-match` |
| **变量引用** | `$var` `${var}` | `$var` `{=words} 分词 | 无 `$` (`$var` 特殊) | `%var%` `$env:` | `$var` `$env:` |
| **错误处理** | `set -e` / `||` | 同 bash | `if not ...` | `if %ERRORLEVEL%` | `try/catch` |
| **面向对象** | 无 | 无 | 无 | 无 | `PSObject`, `Add-Member` |
| **管道类型** | 文本流 | 文本流 | 文本流 | 文本流 | **对象流** |
| **IDE 支持** | VIM/Sublime | ZSH 插件 | Fish 编辑器 | 记事本 | VS Code / ISE |

选型建议：日常开发 **Bash**；个性化需求 **zsh**；新手友好 **fish**；Windows 运维 **PowerShell**；遗留系统 **cmd**。

适合目标读者：**后端工程师、DevOps/SRE、系统管理员、全栈开发者**。

---

## 🚀 本地实验 Quick Start

```bash
git clone https://github.com/xy2401/hello-shell.git && cd hello-shell
npm install              # 安装依赖（Node.js ≥ 20）

# 查看文档站
npm run docs:dev         # http://localhost:4003

# 重新采集所有输出（需 Docker）
npm run collect-outputs  # 容器内运行全部 9 个任务，刷新 *.out.txt 快照
```

环境要求与完整说明见 [快速上手](/guide/getting-started)。

---

## 🔑 八大核心语义骨架

所有 Shell 遵循的共同规则：

| 概念维度 | 核心要点 | 深入学习 |
|---------|---------|---------|
| **变量与引号** | `$var` vs `${var}` vs `{var} `分词 | [见 quoting](/matrix/quoting-variables/) |
| **控制流** | for/while/if/glob 统一模型 | [见 control-flow](/matrix/control-flow/) |
| **函数与管道** | 返回值通道 + 文本流 vs 对象流 | [见 functions](/matrix/functions-pipes/) |
| **错误处理** | 退出码光谱、`set -e`vs`try-catch` | [见 errors](/matrix/errors-signals/) |

详见横向对比矩阵获取完整的八维分析。

适合目标读者：**后端工程师、DevOps/SRE、系统管理员、全栈开发者**。
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
