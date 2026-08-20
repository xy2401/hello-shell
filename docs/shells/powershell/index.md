# PowerShell

> 本页结论：PowerShell 是构建在 .NET 之上的对象管道 shell——管道里流动的是对象而不是文本；本卷把 Windows 内置的 PS5.1 与跨平台的 PS7 同卷对照，PS7 的 Linux 行为有 `demos/pwsh/*.out.txt` 快照为证，Windows 侧快照待首次采集。

## 定位：管道里流的是对象

传统 shell（bash/cmd）的管道传字节流，每一步都在做文本解析；PowerShell
的管道传 **.NET 对象**，cmdlet 之间直接交接结构化数据：

- 命令命名遵循 `Verb-Noun`：`Get-ChildItem`、`Where-Object`、
  `Measure-Object`，语义直白且可枚举；
- 一切构建在 .NET 之上：PS5.1 跑在 .NET Framework，PS7 跑在跨平台的
  .NET（Core），脚本里可以直接调用任意 .NET API；
- 既是 shell 也是脚本语言：变量、函数、try/catch、模块系统一应俱全。

对象管道的直接好处见 06 任务的快照（`demos/pwsh/06_pipes_files.ps1.out.txt`，
Linux 容器内 PowerShell 7 实测）：

```text
globList=app.log,config.csv,readme.txt
logFiles=1
requestLines=2
statusCounts=paid:3,pending:1,refunded:1
```

## 两代同卷：PS5.1 与 PS7

本仓库用**同一套任务脚本的两份变体**对照两代 PowerShell：

| | PS5.1 | PS7 |
| --- | --- | --- |
| 可执行文件 | `powershell.exe` | `pwsh` |
| 平台 | 仅 Windows（内置，最终版本） | Windows / Linux / macOS |
| 基底 | .NET Framework | .NET（Core），版本持续更新 |
| 本仓库运行环境 | windows-latest runner 内置 | Linux：`mcr.microsoft.com/powershell:7.5-debian-12` 容器；Windows：runner 内置 `pwsh` |
| 脚本目录 | `demos/powershell5/` | `demos/powershell7/`（Windows）、`demos/pwsh/`（Linux 采集） |
| 输出快照 | **Windows 快照待首次采集** | Linux：`demos/pwsh/*.out.txt` 已落库；**Windows 快照待首次采集** |

Linux 侧的 PS7 在 digest 锁定的容器里运行（`.env.versions` 中
`POWERSHELL_IMAGE=mcr.microsoft.com/powershell:7.5-debian-12@sha256:…`），
版本证据见 `demos/pwsh/00_env.ps1.out.txt`：

```text
version=PowerShell 7.5.0
shell=pwsh
platform=linux
```

Windows 侧由 `.github/workflows/collect-windows-outputs.yml` 在
windows-latest 上分别用 `powershell`（PS5.1）与 `pwsh`（PS7）采集；
快照落库前，本卷涉及 Windows 输出行为之处均以脚本源码为据。

## PS5 与 PS7 的差异要点

1. **`&&` / `||` / 三元运算符**：`a && b`、`a || b`、`$x ? 1 : 0`、
   `??` 空合并都是 PS7 新增；PS5.1 只能写 `if`/`;` 或用 `-and` 短路。
   PS7 侧脚本因此能写三元赋值（摘自 `demos/powershell7/00_env.ps1`）：

   ```powershell
   $platform = if ($IsWindows) { 'windows' } else { 'linux' }
   ```

   （`if` 作为表达式在 PS5 也可用，但 `&&` 不行。）
2. **跨平台**：PS7 提供 `$IsWindows`/`$IsLinux`/`$IsMacOS` 自动变量，
   demo 里用它做平台分支（如 01 里 Windows 走 `cmd /c dir`、Linux 走
   `bash -c ls`）；PS5.1 不存在这些变量，因为它只跑在 Windows 上。
3. **UTF-8 默认**：PS7 的文件读写与管道默认 UTF-8（无 BOM）；PS5.1 默认
   用 ANSI/OEM 代码页，`>` 重定向甚至是 UTF-16LE——详见
   [常见陷阱](/shells/powershell/pitfalls)。
4. **行为一致性**：PS5.1 是冻结版本（只随 Windows 更新安全补丁），
   PS7 持续演进。两代语法差异集中在上述新运算符与少量 cmdlet 行为上，
   本卷所有基础语法在两边通用。

两个快照佐证 PS7 语义（均出自 `demos/pwsh/`）：

```text
# demos/pwsh/01_hello_io.ps1.out.txt —— 子进程退出码经 $LASTEXITCODE 透传
hello from pwsh
childExitCode=2
scriptExitCode=0
```

```text
# demos/pwsh/07_errors.ps1.out.txt —— try/catch 捕获 + 子进程严格模式退出码
caughtError=true
afterFailure=continued
setEExitCode=1
scriptExitCode=0
```

## 本卷导读

- [语法基础](/shells/powershell/syntax)：对象管道、变量与引号、函数、
  try/catch 与 `$ErrorActionPreference`；
- [入参解析](/shells/powershell/args)：`$args`、`$PSCommandPath`、
  `param()` 块 vs 手工解析；
- [常见陷阱](/shells/powershell/pitfalls)：编码/BOM、布尔输出、
  `$LASTEXITCODE`、路径分隔符；
- 横向对照：[入参矩阵](/matrix/args-matrix)、
  [错误处理矩阵](/matrix/error-handling-matrix)、[labs](/labs/)。
