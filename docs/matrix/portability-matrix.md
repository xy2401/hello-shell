# 可移植性矩阵：跨发行版、跨平台、行尾编码与运行体来源

> 本页结论：可移植性排序清晰——**python 语言层完全跨平台**（但脚本里调外部命令会把平台依赖请回来）；**PowerShell 7 是唯一真正跨平台的 shell**，本仓库 9 个任务里 7 个的 Linux 版（`demos/pwsh`）与 Windows 版（`demos/powershell7`）脚本逐字节相同；bash/zsh/fish 属于 POSIX 世界，无法在 Windows 原生运行，且三者互不兼容（fish 语法与 POSIX 完全断裂，zsh 与 bash 有数组下标、分词默认值等实质差异）；cmd 与 PowerShell 5 是 Windows 专属。行尾与编码各有坑：`.bat` 必须 CRLF（本仓库 cmd 脚本即 CRLF 入库），PowerShell 5 读无 BOM 的 UTF-8 会按 ANSI 解释，故 `demos/powershell5` 全部保持 ASCII，中文注释只出现在 PowerShell 7 脚本里。

## 五维对照

| 运行体 | 跨发行版（Linux） | 跨平台（Windows） | 行尾 / 编码要求 | 运行体获取方式 | 版本锁定与证据 |
| --- | --- | --- | --- | --- | --- |
| bash | POSIX 子集通行各发行版；本仓库脚本用 `#!/usr/bin/env bash` | 无法原生运行（需 WSL/Git Bash 等兼容层） | LF；无编码坑 | 发行版自带 | `bash:5.2` 镜像 tag+digest 双锁；快照 `version=GNU bash, version 5.2.37(1)-release (x86_64-pc-linux-musl)` |
| zsh | 与 bash 有实质差异：数组 1 基、默认不分词、`(N)` 限定符等，脚本不能照抄 | 无法原生运行 | LF | 包管理器安装（本站 `apk add zsh`） | alpine 基底 digest 锁定；快照 `version=zsh 5.9 (x86_64-alpine-linux-musl)` |
| fish | 与 POSIX 语法完全断裂（`set`/`if ... end`），bash 脚本无法迁移 | 无法原生运行 | LF | 包管理器安装（本站 `apk add fish`） | alpine 基底 digest 锁定；快照 `version=fish, version 4.0.2` |
| pwsh（Linux） | 官方 Linux 发行（debian 基底镜像） | **同一套语法直通 Windows**（见 powershell7 行） | LF | 官方容器镜像 | `mcr.microsoft.com/powershell:7.5-debian-12` tag+digest 双锁；快照 `version=PowerShell 7.5.0` |
| cmd | 不适用 | Windows 专属，随系统内置 | **必须 CRLF**；代码页相关字符需避开 | 系统自带（windows-latest runner 内置） | 无镜像可锁；`ver` 输出快照待首次采集 |
| powershell5 | 不适用 | Windows 专属，随系统内置 | **无 BOM 的 UTF-8 会被按 ANSI 读取**——本站 powershell5 脚本全部保持 ASCII | 系统自带（runner 内置） | 版本随 runner 漂移，以 00_env 快照留痕；快照待首次采集 |
| powershell7 | 不适用（Linux 侧见 pwsh 行） | windows-latest runner 预装 | 同 pwsh；支持 UTF-8 脚本（本站 powershell7 脚本含中文注释） | runner 预装 / MSI / Store | 版本随 runner 漂移，以 00_env 快照留痕；快照待首次采集 |
| python | 语言层跨发行版 | **语言层完全跨平台**；但调用平台命令会重新引入依赖 | LF | 官方镜像 / 各平台安装包 | `python:3.12-slim` tag+digest 双锁；快照 `version=Python 3.12.14` |

Windows 侧三行快照待首次采集，相关结论以脚本源码与仓库基础设施为据。

## 逐维度证据

### PowerShell 7：唯一真正跨平台的 shell，7/9 任务脚本零改动

对 `demos/pwsh`（Linux 容器运行）与 `demos/powershell7`（Windows runner 运行）逐任务 `diff`：**9 个任务里 7 个脚本逐字节相同**（02–08 全同），仅 00_env 与 01_hello_io 有差异，且差异只是身份行字符串（`shell=powershell7`、问候语里的运行体名）。`$IsWindows` 分支让同一份逻辑自适应平台（摘自 `demos/powershell7/01_hello_io.ps1`）：

```powershell
if ($IsWindows) {
    cmd /c 'dir C:\nonexistent-hello-shell' 2>$null | Out-Null
} else {
    bash -c 'ls /nonexistent-hello-shell' 2>$null | Out-Null
}
```

「一份脚本、两个平台」在本仓库是已落地的事实，不是承诺。

### POSIX 三兄弟：无法原生跑 Windows，且互不兼容

bash/zsh/fish 都只存在于 Linux 侧目录，Windows 侧对应物是 cmd 与 PowerShell——两套完全不同的语法世界。三者内部也不互通：

```zsh
# demos/zsh/03_args_parsing.zsh —— zsh 数组 1 基（bash 要用 [0]/[1]）
echo "firstArg=${positional[1]}"
```

```zsh
# demos/zsh/02_variables_quoting.zsh —— zsh 默认不分词，${=var} 显式开启
wordArray=( ${=words} )
```

fish 更是连 `case`/`done` 都没有（`if ... end`、`set -l`，见 `demos/fish/*.fish` 全部脚本）。跨发行版方向上，bash 脚本取其 POSIX 子集最稳；本仓库 bash 脚本经 `bash:5.2` alpine 基底容器验证（musl/busybox 环境），快照 `platform=linux`。

### python：语言跨平台，外部命令是后门

python 本身完全跨平台，但任务 01 的对照实现调用了 `ls`（摘自 `demos/python/01_hello_io.py`）：

```python
result = subprocess.run(["ls", "/nonexistent-dir-hello-shell"], ...)
```

`ls` 不是 Windows 命令——这一行就让脚本失去了跨平台资格。这也是本站把 python 采集限定在 Linux 侧的原因，同时是「Shell vs Python 边界」的经典注脚：语言可移植，不等于脚本可移植。详见 [Shell vs Python 边界](/compare/shell-vs-python)。

### 行尾与编码：CRLF 与 BOM 两个坑

对仓库脚本实测 `file`：

- `demos/cmd/*.bat`：**ASCII text, with CRLF line terminators**——批处理必须 CRLF 行尾，本站按此入库。
- `demos/powershell5/*.ps1`：**ASCII text**——刻意保持纯 ASCII。PowerShell 5 遇到无 BOM 的 UTF-8 会按系统 ANSI 代码页解释，非 ASCII 字符有乱码风险，故 powershell5 脚本不写中文注释。
- `demos/powershell7/*.ps1` 与 `demos/pwsh/*.ps1`：**UTF-8 text**——PowerShell 7 默认 UTF-8，可安全携带中文注释。
- `demos/bash/*.sh`：ASCII text executable，LF 行尾。

采集侧同样守编码纪律：`scripts/collect-windows.ps1` 写明输出「ASCII，无 BOM」，用 `[System.Text.Encoding]::ASCII` 落盘。

### 运行体获取与版本锁定

Linux 侧五个运行体全部镜像化、tag+digest 双锁（摘自 `.env.versions`）：

```text
BASH_IMAGE=bash:5.2@sha256:3bee76a96d86d5d2d5efc7c1c570e5a7c95db22348a26944e0e546fa174e3324
PYTHON_IMAGE=python:3.12-slim@sha256:2c941e860699f878900b0edc2403613c234d4b32eda3cc9fa7036991a2a63c4a
ALPINE_IMAGE=alpine:3.22@sha256:14358309a308569c32bdc37e2e0e9694be33a9d99e68afb0f5ff33cc1f695dce
POWERSHELL_IMAGE=mcr.microsoft.com/powershell:7.5-debian-12@sha256:7ab5bd5ca6f95a3351fa0c6a1205237d57048c94542355aab55519a0861a9b25
```

其中 zsh/fish 无官方独立镜像，以 digest 锁定的 alpine 为基底 `apk add`（`demos/zsh/Dockerfile`、`demos/fish/Dockerfile` 各一行 `RUN apk add --no-cache zsh|fish`）。采集时脚本与 fixtures 只读挂载进容器（`scripts/run-docker-demos.js`：`-v ... :ro`），写入只发生在容器内 `/tmp`。

Windows 侧没有镜像可锁：cmd / PowerShell 5 是 windows-latest runner 内置，PowerShell 7 是 runner 预装，版本随 GitHub 更新漂移，以各 `00_env` 快照留痕（当前**快照待首次采集**）。政策细节见[版本政策](/reference/version-policy)。

## 小结

| 结论 | 证据 |
| --- | --- |
| PS7 是唯一真正跨平台的 shell | `demos/pwsh` 与 `demos/powershell7` 逐任务 diff：7/9 脚本逐字节相同，余下 2 个仅身份行不同 |
| python 语言跨平台，但外部命令会重新引入平台依赖 | `demos/python/01_hello_io.py` 调用 `ls` |
| POSIX shells 无法原生跑 Windows；fish 与 POSIX 断裂、zsh 与 bash 有实质差异 | 目录布局（Linux 侧三 shell vs Windows 侧 cmd/PS）；zsh 1 基数组与 `${=var}` 源码 |
| `.bat` 必须 CRLF；PS5 惧怕无 BOM UTF-8，PS7 默认 UTF-8 | `file` 实测：cmd 脚本 CRLF、powershell5 脚本纯 ASCII、powershell7/pwsh 脚本 UTF-8 |
| Linux 运行体 tag+digest 双锁；Windows 运行体随 runner 漂移、快照留痕 | `.env.versions`、`demos/{zsh,fish}/Dockerfile`、`scripts/run-docker-demos.js` |

延伸阅读：[版本政策](/reference/version-policy)、[证据政策](/reference/evidence-policy)、[快速上手](/guide/getting-started)、[实验说明](/labs/)。
