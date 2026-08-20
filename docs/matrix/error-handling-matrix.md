# 错误处理矩阵：退出码、双轨制与异常

> 本页结论：八个运行体的错误模型分四族——bash/zsh 靠**退出码 + `set -e`**、fish 靠 **`$status`（且永不自动中止）**、cmd 靠 **`ERRORLEVEL` + 延迟展开（没有任何自动中止）**、PowerShell 5/7 靠 **`$ErrorActionPreference` + `try/catch` 与 `$LASTEXITCODE` 的双轨制**，python 是**异常**。任务 07 的契约行 `caughtError=true`、`afterFailure=continued`、`setEExitCode=1`、`scriptExitCode=0` 五体一致，证明「失败可被捕获、捕获后照常继续」在所有模型里都成立；任务 01 的快照还顺手证明了两件事：stderr 与 stdout 确实分流（stderr 行不进快照），以及退出码的数值由命令自身定义、不由 shell 定义（busybox `ls` 失败=1，GNU `ls` 失败=2）。

## 统一实验

- 任务 01：向 stdout/stderr 各写一行，再运行一个必失败的命令，取其退出码。
- 任务 07：捕获一次失败并继续执行；再制造一次「未捕获即中止」的失败，取其退出码。

五个 Linux 运行体的任务 07 快照逐字一致：

```text
# demos/bash/07_errors.sh.out.txt（demos/zsh、demos/fish、demos/pwsh、demos/python 快照逐字相同）
caughtError=true
afterFailure=continued
setEExitCode=1
scriptExitCode=0
```

Windows 侧三行快照待首次采集，下表依据脚本源码 `demos/cmd/07_errors.bat`、`demos/cmd/01_hello_io.bat`、`demos/powershell5/*.ps1`、`demos/powershell7/*.ps1`。

## 错误模型五维对照

| 运行体 | 错误感知模型 | 「遇错即停」开关 | 错误恢复写法 | 错误流分离 | 子进程退出码获取 |
| --- | --- | --- | --- | --- | --- |
| bash | 退出码（0 成功 / 非零失败），`$?` 取上一条 | `set -e`（本任务在子 shell 里演示） | `cmd \|\| 恢复`、`if ! cmd` | `>&2` 写 stderr、`2>&1`/`2>/dev/null` 重定向 | `$?` |
| zsh | 退出码 + `$?`，同 bash | `set -e`，同 bash | 同 bash | 同 bash | `$?` |
| fish | `$status`（每条命令后刷新） | **没有**等价开关：失败永不自动中止脚本 | `if not cmd` / `cmd; or 恢复` | 同 POSIX 重定向语法 | `$status` |
| pwsh（Linux） | **双轨**：cmdlet 错误记录（可升级为终止性异常）+ 原生命令退出码 | `$ErrorActionPreference='Stop'`（把错误升级为终止性） | `try { } catch { }` | `Write-Error`（错误流）/ `[Console]::Error.WriteLine`（真 stderr）/ `2> $null` | `$LASTEXITCODE` |
| cmd | `ERRORLEVEL`（整数） | **没有**：逐条手工 `if !ERRORLEVEL! neq 0` 检查 | `if !ERRORLEVEL! neq 0 set "CAUGHT=true"` | `1>&2` 写 stderr、`2>nul` 丢弃 | 子 `cmd /c` 后读 `!ERRORLEVEL!` |
| powershell5 | 双轨，同 pwsh | 同 pwsh | `try/catch` | 同 pwsh | `$LASTEXITCODE` |
| powershell7 | 双轨，同 pwsh | 同 pwsh | `try/catch` | 同 pwsh | `$LASTEXITCODE` |
| python | **异常**（`Exception` 体系） | 未捕获异常即中止（退出码 1） | `try/except` | `print(..., file=sys.stderr)` | `subprocess.run(...).returncode` |

## 逐维度证据

### 捕获失败并继续：`caughtError=true` 与 `afterFailure=continued`

bash/zsh 用 `||` 接住失败（摘自 `demos/bash/07_errors.sh`）：

```bash
false || caughtError=true  # failure is caught; the script keeps running
```

fish 没有 `set -e` 这类开关，失败本来就不中止脚本，恢复用 `if not`（摘自 `demos/fish/07_errors.fish`）：

```fish
function run_fails
    return 3
end
if not run_fails
    set caught true
end
```

pwsh 必须把错误**升级为终止性**才进得了 `catch`（摘自 `demos/pwsh/07_errors.ps1`）：

```powershell
try {
    Get-Content -Path '/nonexistent-hello-shell' -ErrorAction Stop | Out-Null
} catch {
    $caughtError = $true
}
```

cmd 逐条检查 `ERRORLEVEL`，注意必须开延迟展开才能在块内读到刷新后的值（摘自 `demos/cmd/07_errors.bat`，快照待首次采集）：

```bat
setlocal EnableDelayedExpansion
dir "%FIXTURES%\no-such-dir" >nul 2>nul
if !ERRORLEVEL! neq 0 set "CAUGHT=true"
```

python 用 `check=True` 把非零退出码变成异常再捕获（摘自 `demos/python/07_errors.py`）：

```python
try:
    subprocess.run([sys.executable, "-c", "raise RuntimeError('boom')"], check=True, ...)
except subprocess.CalledProcessError as exc:
    caught = True
    fail_code = exc.returncode
```

五条路径，同一行 `caughtError=true` + `afterFailure=continued`。

### 「遇错即停」：各有各的开关，fish/cmd 干脆没有

bash/zsh 的 `set -e` 在子 shell 里演示：失败立刻中止该子 shell，退出码 1 被外层接住（摘自 `demos/bash/07_errors.sh`）：

```bash
( set -e; false )  # set -e makes the subshell stop at the first failure
setEExitCode=$?
```

快照行 `setEExitCode=1` 即此。pwsh 的对应物是子进程里的 `$ErrorActionPreference='Stop'`：未捕获的终止性错误使子 pwsh 以非零码退出（摘自 `demos/pwsh/07_errors.ps1`）：

```powershell
& pwsh -NoProfile -Command '$ErrorActionPreference=''Stop''; Get-Content -Path /nonexistent-hello-shell | Out-Null' > $null 2> $null
Write-Output "setEExitCode=$LASTEXITCODE"
```

powershell5/7 的 Windows 版同构（`& powershell -NoProfile -Command ...`，快照待首次采集）。cmd 没有「遇错即停」，只能把失败命令放进子 `cmd /c` 再读 `!ERRORLEVEL!`（bat 源码注释原话：*no set -e in cmd*）。python 的「遇错即停」是语言默认：未捕获异常即退出码 1，本任务用 `check=True` 把它显式接住。

### PowerShell 的双轨制

PowerShell 是唯一需要同时盯两条错误线的运行体：cmdlet 失败产生**错误记录**（默认不中止、不进 `catch`），原生命令失败只更新 **`$LASTEXITCODE`**。任务 01 各展示了一条轨：`[Console]::Error.WriteLine` 写 stderr，`$LASTEXITCODE` 收原生命令退出码（摘自 `demos/pwsh/01_hello_io.ps1`）：

```powershell
bash -c 'ls /nonexistent-hello-shell' 2>$null | Out-Null
Write-Output "childExitCode=$LASTEXITCODE"
```

### 错误流分离：stderr 行不进快照

任务 01 每个实现都向 stderr 写了一行（bash/zsh/fish：`echo "stderr: ..." >&2`；pwsh：`[Console]::Error.WriteLine`；cmd：`echo ... 1>&2`，快照待首次采集；python：`print(..., file=sys.stderr)`）。而 Linux 采集只收 stdout，因此五份 01 快照里**都没有** stderr 那行——分流本身就是证据：

```text
# demos/bash/01_hello_io.sh.out.txt
stdout: hello from bash
childExitCode=1
scriptExitCode=0
```

（`stderr: this line goes to stderr` 被 `>&2` 送去了 stderr，不在快照内。）

### 退出码数值由命令定义，不由 shell 定义

对比任务 01 的 `childExitCode=` 行：bash/zsh/fish 三份快照是 `childExitCode=1`，pwsh/python 两份是 `childExitCode=2`。失败的都是同一条 `ls`，差别在容器里的实现：alpine 的 busybox `ls` 失败退出 1，debian 的 GNU `ls` 失败退出 2。shell 只是如实转述命令给出的数值——这也是为什么跨 shell 脚本不该硬编码「失败码 = 几」，只该判断「是否非零」。

## 小结

| 结论 | 证据 |
| --- | --- |
| 四族模型：退出码（bash/zsh）、$status（fish）、ERRORLEVEL（cmd）、双轨制（PS5/7），外加异常（python） | 任务 07 各实现源码与五体一致的契约行 |
| 「遇错即停」：bash/zsh `set -e`、PS `$ErrorActionPreference='Stop'`、python 默认即停；fish/cmd 无此设施 | `setEExitCode=1` 五体一致；cmd bat 源码注释 *no set -e in cmd*（快照待首次采集） |
| stderr 与 stdout 分流是普遍能力 | 任务 01 各实现的 `>&2` / `1>&2` / `[Console]::Error.WriteLine` / `file=sys.stderr`；stderr 行缺席于快照 |
| 退出码数值归命令所有 | 任务 01 `childExitCode=1`（busybox ls）vs `=2`（GNU ls） |

延伸阅读：[错误与信号统一骨架](/fundamentals/errors-signals)、[矩阵总览](/matrix/)、[实验说明](/labs/)。
