# 错误与信号：从退出码到异常的光谱

> 本页结论：错误模型是一条光谱——POSIX shell 与 cmd 用**退出码**（0 成功、非零失败，失败默认不中断脚本）；PowerShell 把错误分成**非终止性/终止性**两类，`try/catch` 只能接住终止性错误；Python 用**异常**。任务 07 让五个 Linux 运行体做同一件事——捕获一次失败、继续执行、报告子进程的失败码——输出逐字一致：`caughtError=true`、`afterFailure=continued`、`setEExitCode=1`、`scriptExitCode=0`。信号（Ctrl+C/SIGTERM）一句话带过，本站不做实验。

## 统一验证点

任务 07 在所有运行体上回答三个问题：

1. 一条命令失败了，脚本能不能**捕获**并继续？（`caughtError`）
2. 失败之后后续语句还跑不跑？（`afterFailure`）
3. 「遇到失败立即停」的语义（bash 的 `set -e`）对应多大的退出码？（`setEExitCode`）

## 证据：五个运行体输出逐字一致

```text
# demos/bash/07_errors.sh.out.txt
caughtError=true
afterFailure=continued
setEExitCode=1
scriptExitCode=0
```

```text
# demos/pwsh/07_errors.ps1.out.txt
caughtError=true
afterFailure=continued
setEExitCode=1
scriptExitCode=0
```

```text
# demos/python/07_errors.py.out.txt
caughtError=true
afterFailure=continued
setEExitCode=1
scriptExitCode=0
```

（`demos/zsh/07_errors.zsh.out.txt`、`demos/fish/07_errors.fish.out.txt` 内容相同。）四行输出对应三个验证点加一个收尾承诺：脚本自身仍以 `scriptExitCode=0` 退出。

## 光谱第一档：退出码（bash / zsh / fish / cmd）

POSIX 系 shell 的错误就是一个整数：每条命令结束都带退出码，`$?`（fish 为 `$status`）里可以读到。**默认行为是失败了也继续往下跑**——想「捕获」就用短路逻辑或条件分支：

```bash
# demos/bash/07_errors.sh
caughtError=false
false || caughtError=true   # 失败被捕获，脚本继续
echo "caughtError=$caughtError"

( set -e; false )           # set -e：子 shell 遇到失败立即停
setEExitCode=$?
echo "setEExitCode=$setEExitCode"
```

`set -e` 是 bash/zsh「失败即退出」的开关；演示把它放进子 shell，让父 shell 用 `$?` 量出退出码 1（快照中 `setEExitCode=1`）。zsh 版源码与 bash 版逐行相同（`demos/zsh/07_errors.zsh`）。fish 没有 `set -e`，用 `if not run_fails` 捕获（`demos/fish/07_errors.fish`），快照同为 `caughtError=true`。

cmd 的对应物是 `ERRORLEVEL`，且没有 `set -e` 等价开关（源码注释原话：cmd has no set -e）。cmd 版用 `setlocal EnableDelayedExpansion` 后以 `if !ERRORLEVEL! neq 0` 分支——**必须用延迟展开 `!ERRORLEVEL!`**，否则 `%ERRORLEVEL%` 在整段代码块被解析时就已固定，读到的是旧值：

```bat
rem demos/cmd/07_errors.bat
dir "%FIXTURES%\no-such-dir" >nul 2>nul
if !ERRORLEVEL! neq 0 set "CAUGHT=true"
```

「失败即停」在 cmd 里只能靠子进程 `cmd /c "..."` 后读 `!ERRORLEVEL!` 模拟（同文件第 15–16 行）。cmd 快照（`demos/cmd/07_errors.bat.out.txt`）同为四行 `caughtError=true` / `afterFailure=continued` / `setEExitCode=1` / `scriptExitCode=0`（另含一行 echo 回显）。

## 光谱第二档：终止性/非终止性错误（PowerShell）

PowerShell 的 cmdlet 失败默认**不**抛异常，而是往错误流写一条非终止性错误、继续执行；`try/catch` 只捕获终止性错误。所以任务 07 先用 `-ErrorAction Stop` 把错误升级，才能被 `catch` 接住：

```powershell
# demos/pwsh/07_errors.ps1
try {
    Get-Content -Path '/nonexistent-hello-shell' -ErrorAction Stop | Out-Null
} catch {
    $caughtError = $true
}
```

`setEExitCode` 的测量则换个角度：子 PowerShell 进程里设 `$ErrorActionPreference='Stop'`，未捕获的终止性错误使子进程以非零码退出，父进程从 `$LASTEXITCODE` 读到 1（快照 `setEExitCode=1`）。全局变量 `$ErrorActionPreference` 与逐 cmdlet 的 `-ErrorAction` 的关系、`$?` 与 `$LASTEXITCODE` 的分工，见 [PowerShell 分卷 pitfalls](/shells/powershell/pitfalls)。`demos/powershell5/07_errors.ps1.out.txt`、`demos/powershell7/07_errors.ps1.out.txt` 已入库，四行与 Linux 侧 pwsh 快照逐字相同（ps5 版子进程用 `powershell`、ps7 版用 `pwsh`）。

## 光谱第三档：异常（Python）

Python 没有退出码光谱，失败即异常。对照实现让子进程抛 `RuntimeError`，`check=True` 把非零退出翻译成 `CalledProcessError`，由 `except` 捕获并读出 `returncode`：

```python
# demos/python/07_errors.py
except subprocess.CalledProcessError as exc:
    caught = True
    fail_code = exc.returncode
```

源码注释点破了对照关系：未捕获的异常会使 Python 以退出码 1 退出，所以子进程「raise → exit code 1」与 bash 的 `set -e` 失败退出码 1 恰好对齐（快照 `setEExitCode=1`）。

## 信号：一句话

Ctrl+C（SIGINT）与 SIGTERM 会中断前台脚本，POSIX shell 可用 `trap` 安装处理器、Windows 侧由控制台事件承载——本站不安排信号实验，因此没有对应快照；各 shell 的 trap/事件写法见分卷 pitfalls 页（如 [bash pitfalls](/shells/bash/pitfalls)）。

## 本页证据清单

| 快照 | 关键行 |
| --- | --- |
| `demos/bash/07_errors.sh.out.txt`、`demos/zsh/07_errors.zsh.out.txt` | `setEExitCode=1`（`set -e` 子 shell 退出码） |
| `demos/fish/07_errors.fish.out.txt` | `caughtError=true`（`if not` 捕获） |
| `demos/pwsh/07_errors.ps1.out.txt` | `caughtError=true`（`try/catch` + `-ErrorAction Stop`） |
| `demos/python/07_errors.py.out.txt` | `caughtError=true`（`except CalledProcessError`） |
| `demos/cmd/07_errors.bat.out.txt` | `caughtError=true`（`!ERRORLEVEL!` 延迟展开）、`setEExitCode=1`（`cmd /c` 子进程） |
| `demos/powershell5/07_errors.ps1.out.txt`、`demos/powershell7/07_errors.ps1.out.txt` | 四行与 Linux 侧逐字相同（`try/catch` + `-ErrorAction Stop`） |

## 延伸阅读

- [错误处理矩阵](/matrix/error-handling-matrix)：`set -e` / `trap` / `$ErrorActionPreference` / `try-except` 横向对照
- [统一任务实验总览 · 任务 07](/labs/#任务-07-错误处理)
- [函数与管道](/fundamentals/functions-pipes)：退出码作为函数返回通道的用法
