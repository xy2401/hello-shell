# cmd


> 本页结论：cmd 是 Windows 最古老的命令行解释器，今天的主要价值是兼容几十年积累的批处理脚本（.bat/.cmd）；它内置于每一台 Windows 与 windows-latest runner，没有独立发行渠道也无法锁版本，本仓库以 00_env 采集的 `ver` 输出快照留痕。

## 定位：为兼容而生的批处理解释器

cmd.exe 是 Windows NT 系的命令行解释器，语法直接继承自 MS-DOS 时代的
COMMAND.COM：

- **面向批处理脚本**：`.bat`/`.cmd` 文件逐行解释执行，语法集在二十多年前
  就基本冻结，此后几乎只修 bug、不加新特性。
- **文本与退出码的世界**：没有对象、没有真正的数组、没有函数，只有字符串、
  环境变量和 `ERRORLEVEL`——这既是它的局限，也是它能被一切 Windows 工具
  调用的原因。
- **现状**：交互式使用已被 PowerShell 与 Windows Terminal 取代，但 CI 脚本、
  构建系统、安装程序里仍大量存在 `.bat`，读得懂 cmd 是维护 Windows 存量
  脚本的必备技能。

本卷四页：[语法基础](/products/cmd/syntax)、[入参解析](/products/cmd/args)、
[常见陷阱](/products/cmd/pitfalls)。九个统一任务与其他 Shell 的横向对照见
[任务矩阵](/matrix/args-matrix)与 [入参矩阵](/matrix/args-matrix)。

## 运行环境：windows-latest runner 内置

cmd 是 Windows 操作系统的一部分，不需要也无法安装：

| 项 | 值 |
| --- | --- |
| 宿主 | GitHub Actions `windows-latest` runner 内置 |
| 调用方式 | `cmd /c demos\cmd\NN_xxx.bat` |
| 版本采集 | `demos/cmd/00_env.bat` 用内置命令 `ver` 捕获版本行 |
| 输出快照 | `demos/cmd/00_env.bat.out.txt`，第 3 行 `version=Microsoft Windows [Version 10.0.26100.33158]` |

`00_env.bat` 的核心逻辑（摘自 `demos/cmd/00_env.bat`）：

```bat
rem capture the single line printed by the ver builtin
set "VERSION_LINE="
for /f "delims=" %%v in ('ver') do set "VERSION_LINE=%%v"
echo version=!VERSION_LINE!
echo shell=cmd
echo platform=windows
```

采集由 `.github/workflows/collect-windows-outputs.yml` 在 windows-latest 上
执行 `scripts/collect-windows.ps1` 完成；`demos/cmd/*.bat.out.txt` 九份快照
已全部落库，快照证实 `ver` 行被完整捕获（`00_env.bat.out.txt` 第 3 行：
`version=Microsoft Windows [Version 10.0.26100.33158]`，即 Server 2025
世代的构建号）。注意 cmd 快照的前两行总是一个空行加一条带回显的
`rem` 注释——因为每个 `.bat` 的首行是注释、`@echo off` 在第二行才生效，
这是 cmd 快照区别于其他 shell 快照的外观特征。

## 无镜像锁定：漂移政策

Linux 侧的 bash/zsh/fish/python/pwsh 都在容器里运行，镜像以 tag + digest
双锁定写入 `.env.versions`；**cmd 没有镜像可锁**——它随 Windows 版本走，
而 `windows-latest` 标签本身会滚动（例如从 Server 2022 切到 Server 2025），
`ver` 输出的版本号因此可能漂移。

本仓库的应对：

1. 每次采集把 `ver` 输出写进 `00_env.bat.out.txt`，快照即版本留痕
   （当前留痕为构建号 `10.0.26100.33158`）；
2. 脚本只使用冻结多年的稳定语法（`for /f`、`call :label`、延迟展开），
   不依赖任何新近行为，漂移风险极低；
3. 完整规则见 [版本与漂移政策](/reference/version-policy)。

## 九个任务脚本一览

| 脚本 | 任务 | 看点 |
| --- | --- | --- |
| `00_env.bat` | 环境探测 | `ver` + `for /f` 捕获输出 |
| `01_hello_io.bat` | stdout/stderr 与子进程退出码 | `1>&2`、`!ERRORLEVEL!` |
| `02_variables_quoting.bat` | 变量与引号 | `set "VAR=value"`、`for` 分词 |
| `03_args_parsing.bat` | 入参解析 | `%~1` 去引号、`shift` 循环 |
| `04_control_flow.bat` | 控制流 | `for /l`、`for /f skip=1 tokens=4` |
| `05_functions_scope.bat` | 函数与作用域 | `call :label`、`exit /b`、`setlocal` |
| `06_pipes_files.bat` | 管道与文件 | `dir /b`、`find`、`type \| find /c` |
| `07_errors.bat` | 错误处理 | `ERRORLEVEL` 分支、子 cmd 退出码 |
| `08_real_world.bat` | 综合实战 | `copy`、`ren *.log *.log.bak`、校验 |

动手复现见 [统一任务实验](/matrix/experiments)。
