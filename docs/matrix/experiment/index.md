# 统一任务实验总览

> 本页结论：9 个统一任务 × 8 个运行体构成本站的实证基础——同一份输入、同一组验证点、同样的 `key=value` 输出行，Linux 五个运行体（bash/zsh/fish/pwsh/python）的快照已入库且多数逐字一致，Windows 三个运行体（cmd/powershell5/powershell7）的快照由 CI 采集。本页给出任务总表、运行方式，以及每个任务的跨 shell 输出对照。

## 9 任务总表

| 编号 | 名称 | 验证点 | 快照位置 |
| --- | --- | --- | --- |
| 00 | env | 自报版本与平台（`version`/`shell`/`platform`） | `demos/<shell>/00_env.<ext>.out.txt` |
| 01 | hello_io | stdout/stderr 分流；捕获子进程非零退出码 | `demos/<shell>/01_hello_io.<ext>.out.txt` |
| 02 | variables_quoting | 带空格赋值、分词计数、插值、`*` 保持字面 | `demos/<shell>/02_variables_quoting.<ext>.out.txt` |
| 03 | args_parsing | 位置参数、带空格参数、`--verbose`/`-n` 选项解析 | `demos/<shell>/03_args_parsing.<ext>.out.txt` |
| 04 | control_flow | `sum123=6` / `paidCount=3` / `loopFiles=3` | `demos/<shell>/04_control_flow.<ext>.out.txt` |
| 05 | functions_scope | 函数返回值、退出码 7 通道、局部作用域 | `demos/<shell>/05_functions_scope.<ext>.out.txt` |
| 06 | pipes_files | glob 列举、通配计数、`grep` 数行、按列分组统计 | `demos/<shell>/06_pipes_files.<ext>.out.txt` |
| 07 | errors | 捕获失败并继续、`set -e` 类语义的退出码 | `demos/<shell>/07_errors.<ext>.out.txt` |
| 08 | real_world | 复制—改名—校验—报告批处理（`verify=ok`） | `demos/<shell>/08_real_world.<ext>.out.txt` |

其中 `<shell>` 为 `bash`/`zsh`/`fish`/`pwsh`/`python`/`cmd`/`powershell5`/`powershell7`，`<ext>` 为对应脚本扩展名（`.sh`/`.zsh`/`.fish`/`.ps1`/`.py`/`.bat`）。骨架解读见 [[八大核心语义](/matrix/quoting-variables)，证据的采信规则见 [证据政策](/reference/evidence-policy)。

## 统一输入

所有任务共用 `demos/shared/fixtures`：

- `orders.csv`：1 行表头 + 5 行订单，`status` 列含 3 条 `paid`、1 条 `pending`、1 条 `refunded`——任务 04/06 的过滤与统计都以此为输入；
- `data/`：`app.log`（4 行，其中 2 行含 `request`）、`config.csv`、`readme.txt`——任务 04/06/08 的 glob 与改名对象。

Linux 容器内 fixtures 挂载在 `/fixtures`；Windows 侧由采集器设置环境变量 `HELLO_SHELL_FIXTURES` 指向 `demos/shared/fixtures`。实验只读使用 fixtures，写入仅发生在容器内 `/tmp` 或系统临时目录（任务 08）。

## 运行方式

**Linux（bash/zsh/fish/pwsh/python）**：

```bash
npm install
npm run collect-outputs   # node scripts/run-docker-demos.js：容器内运行全部任务，刷新 *.out.txt
```

容器镜像以 tag+digest 双锁定（见 `.env.versions`），快照与源码同目录入库。

**Windows（cmd/PowerShell 5/PowerShell 7）**：

- CI：GitHub Actions 工作流 `collect-windows-outputs`（`.github/workflows/collect-windows-outputs.yml`，手动触发），在 `windows-latest` runner 上运行 `scripts/collect-windows.ps1` 并自动提交更新后的 `demos/**/*.out.txt`；
- 本地（需 Windows）：`pwsh scripts/collect-windows.ps1`。

Windows runner 内置运行体版本会随 GitHub 更新漂移，以 `00_env` 快照留痕（版本政策见 [reference](/reference/evidence-policy)）。`demos/cmd`、`demos/powershell5`、`demos/powershell7` 的 27 份 `.out.txt` 已全部入库（各 9 份），下文的 Windows 对照均以这些快照为据。

## 任务 00：环境指纹

**目标**：让每个运行体自报家门——版本号、shell 名、平台，作为全部实验的版本基线。

```text
# demos/bash/00_env.sh.out.txt
version=GNU bash, version 5.2.37(1)-release (x86_64-pc-linux-musl)
shell=bash
platform=linux
```

```text
# demos/fish/00_env.fish.out.txt
version=fish, version 4.0.2
shell=fish
platform=linux
```

```text
# demos/pwsh/00_env.ps1.out.txt
version=PowerShell 7.5.0
shell=pwsh
platform=linux
```

cmd / PowerShell 5 / PowerShell 7（Windows）三份快照已入库，关键行：

```text
# demos/cmd/00_env.bat.out.txt（另含一行 echo 回显）
version=Microsoft Windows [Version 10.0.26100.33158]
shell=cmd
platform=windows
```

```text
# demos/powershell5/00_env.ps1.out.txt
version=PowerShell 5.1.26100.33158
shell=powershell5
platform=windows
```

```text
# demos/powershell7/00_env.ps1.out.txt
version=PowerShell 7.6.4
shell=powershell7
platform=windows
```

版本号随 runner 漂移（采集时点：cmd/PS5 内核版本 26100.33158，PS7 为 7.6.4）。

## 任务 01：I/O 与退出码

**目标**：验证 stdout/stderr 两条流分得开，并且能捕获子进程的非零退出码。一个内嵌证据：脚本都向 stderr 写了一行（如 bash 的 `stderr: this line goes to stderr`），但下方 stdout 快照里**没有**这一行——分流成功本身就是结果。

```text
# demos/bash/01_hello_io.sh.out.txt
stdout: hello from bash
childExitCode=1
scriptExitCode=0
```

```text
# demos/pwsh/01_hello_io.ps1.out.txt
hello from pwsh
childExitCode=2
scriptExitCode=0
```

bash/zsh/fish 的失败命令是 `ls` 不存在的目录（退出码 1）；pwsh 与 Python 版按平台选择失败命令——Linux 走 `bash -c 'ls ...'` 得 2，Windows 走 `cmd /c dir` 得 1（源码注释原话：cmd dir=1，bash ls=2，具体值随平台），所以 `demos/python/01_hello_io.py.out.txt` 同为 `childExitCode=2`。三份 Windows 快照已入库并证实推断：`demos/cmd/01_hello_io.bat.out.txt`、`demos/powershell5/01_hello_io.ps1.out.txt`、`demos/powershell7/01_hello_io.ps1.out.txt` 均为 `childExitCode=1`（stderr 行在快照中可见，分流同样成立）。

## 任务 02：变量与引号

**目标**：验证带空格赋值、分词计数、插值、含 `*` 值保持字面四个点。模型解析见 [变量与引号](/matrix/quoting-variables)。

```text
# demos/bash/02_variables_quoting.sh.out.txt
value=hello world
wordCount=3
interpolated=value-is-42
starLiteral=a*b*c
```

```text
# demos/zsh/02_variables_quoting.zsh.out.txt
value=hello world
wordCount=3
interpolated=value-is-42
starLiteral=a*b*c
```

输出一致但机制不同：bash 靠未加引号展开的默认分词（`set -- $words`），zsh 需 `${=words}` 显式开启分词。fish/pwsh/python 快照同为这四行；Windows 三份快照（`demos/cmd/02_variables_quoting.bat.out.txt`、`demos/powershell5/02_variables_quoting.ps1.out.txt`、`demos/powershell7/02_variables_quoting.ps1.out.txt`）已入库，四行与 Linux 侧逐字相同——cmd 用 `for` 分词，PowerShell 用 `-split`。

## 任务 03：入参解析

**目标**：脚本以样例参数重新调用自身（`alice "bob smith" --verbose -n 3`），验证位置参数起点、带空格参数保形、长短选项解析。

```text
# demos/bash/03_args_parsing.sh.out.txt
invocation=03_args_parsing.sh
argCount=5
firstArg=alice
secondArg=bob smith
verboseFlag=true
nValue=3
```

```text
# demos/pwsh/03_args_parsing.ps1.out.txt
invocation=03_args_parsing.ps1
argCount=5
firstArg=alice
secondArg=bob smith
verboseFlag=true
nValue=3
```

`secondArg=bob smith` 完整保形是两个运行体都守住了引号边界。各 shell 入参模型的系统差异（`$0`/`$args[0]` 是否占脚本名等）见 [入参矩阵](/matrix/args-matrix)。Windows 三份快照已入库：`demos/powershell5`、`demos/powershell7` 的 03 快照与上方 pwsh 版逐字相同；`demos/cmd/03_args_parsing.bat.out.txt` 的 `argCount=5`、`firstArg=alice`、`secondArg=bob smith`、`verboseFlag=true`、`nValue=3` 亦一致，仅 `invocation=3`（`call "%~f0"` 自调用下 `%~nx0` 的取值）与其余各体的脚本名形态不同。

## 任务 04：控制流

**目标**：`for` 求和、逐行读 CSV 过滤、glob 遍历计数。模型与坑位解析见 [控制流](/matrix/control-flow)。

```text
# demos/fish/04_control_flow.fish.out.txt
sum123=6
paidCount=3
loopFiles=3
```

```text
# demos/pwsh/04_control_flow.ps1.out.txt
sum123=6
paidCount=3
loopFiles=3
```

bash/zsh/python 快照与上面两份逐字相同（对照 `demos/bash/04_control_flow.sh.out.txt`）。Windows 三份快照（`demos/cmd/04_control_flow.bat.out.txt`、`demos/powershell5/04_control_flow.ps1.out.txt`、`demos/powershell7/04_control_flow.ps1.out.txt`）已入库，同为这三行——八体一致。

## 任务 05：函数与作用域

**目标**：区分值通道与退出码通道——`functionResult=42` 走值通道，`exitCodeReturn=7` 走退出码通道，`afterCall=outer` 验证局部作用域。解析见 [函数与管道](/matrix/functions-pipes)。

```text
# demos/bash/05_functions_scope.sh.out.txt
functionResult=42
exitCodeReturn=7
afterCall=outer
```

```text
# demos/fish/05_functions_scope.fish.out.txt
functionResult=42
exitCodeReturn=7
afterCall=outer
```

```text
# demos/pwsh/05_functions_scope.ps1.out.txt
functionResult=42
exitCodeReturn=7
afterCall=outer
```

捕获 7 的机制：bash/zsh 读 `$?`，fish 读 `$status`，pwsh 由子进程 `exit 7` 后读 `$LASTEXITCODE`。Windows 三份快照（`demos/cmd/05_functions_scope.bat.out.txt`、`demos/powershell5/05_functions_scope.ps1.out.txt`、`demos/powershell7/05_functions_scope.ps1.out.txt`）已入库，同为这三行；cmd 的 7 走 `call :label` 子例程 + `exit /b 7` 后读 `!ERRORLEVEL!`，ps5/ps7 与 pwsh 同为子进程 `exit 7` → `$LASTEXITCODE`。

## 任务 06：管道与文件

**目标**：glob 列举、通配计数、模式数行、按 CSV 列分组统计——同一条统计，文本管道、对象管道、显式代码三种写法。解析见 [函数与管道](/matrix/functions-pipes)。

```text
# demos/bash/06_pipes_files.sh.out.txt
globList=app.log,config.csv,readme.txt
logFiles=1
requestLines=2
statusCounts=paid:3,pending:1,refunded:1
```

```text
# demos/pwsh/06_pipes_files.ps1.out.txt
globList=app.log,config.csv,readme.txt
logFiles=1
requestLines=2
statusCounts=paid:3,pending:1,refunded:1
```

```text
# demos/python/06_pipes_files.py.out.txt
globList=app.log,config.csv,readme.txt
logFiles=1
requestLines=2
statusCounts=paid:3,pending:1,refunded:1
```

bash/zsh 的 `statusCounts` 由 `tail | cut | sort | uniq -c | awk` 文本管道得出，pwsh 由 `Import-Csv | Group-Object` 对象管道得出，python 用字典计数得出——三路同果。Windows 三份快照已入库：`demos/powershell5/06_pipes_files.ps1.out.txt`、`demos/powershell7/06_pipes_files.ps1.out.txt` 四行逐字相同；`demos/cmd/06_pipes_files.bat.out.txt` 有一处实测差异——`requestLines=4` 而非 2，因为 cmd 的 `find` 大小写不敏感且做子串匹配，`"request"` 中的 `st` 也命中了 `app started`/`app stopped`（以快照为准）。

## 任务 07：错误处理

**目标**：捕获一次失败并继续执行，测量「失败即停」语义对应的退出码。光谱模型见 [错误与信号](/matrix/errors-signals)。

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

bash/zsh 用 `false || caught=true` 与子 shell `set -e`；pwsh 用 `try/catch` + `-ErrorAction Stop` 与子进程 `$ErrorActionPreference='Stop'`（源码注释原话：catch 之后脚本照常继续，不会像 bash 的 set -e 那样中断）。cmd 版以 `!ERRORLEVEL!`（延迟展开）判断失败、以 `cmd /c` 子进程模拟失败即停——快照（`demos/cmd/07_errors.bat.out.txt`）证实四行与 Linux 侧逐字相同；`demos/powershell5/07_errors.ps1.out.txt`、`demos/powershell7/07_errors.ps1.out.txt` 同为这四行。

## 任务 08：综合实战

**目标**：一条完整批处理流水线——复制 fixtures 到暂存目录、把 `*.log` 改名为 `*.log.bak`、校验无遗漏、输出报告。

```text
# demos/bash/08_real_world.sh.out.txt
prepared=3
renamed=1
unchanged=2
verify=ok
report=prepared=3,renamed=1,unchanged=2
```

```text
# demos/pwsh/08_real_world.ps1.out.txt
prepared=3
renamed=1
unchanged=2
verify=ok
report=prepared=3,renamed=1,unchanged=2
```

`data/` 下 3 个文件：1 个 `.log` 被改名，其余 2 个保持不变，`verify=ok` 表示校验通过（无残留 `.log`、无缺失 `.log.bak`）。zsh/fish/python 快照同为这五行。Windows 三份快照（`demos/cmd/08_real_world.bat.out.txt`、`demos/powershell5/08_real_world.ps1.out.txt`、`demos/powershell7/08_real_world.ps1.out.txt`）已入库，同为这五行——八体一致。

## 延伸阅读

- [[八大核心语义](/matrix/quoting-variables)：五个维度与 9 任务的映射
- 横向矩阵：[入参](/matrix/args-matrix) / [引号](/matrix/quoting-matrix) / [通配](/matrix/globbing-matrix) / [错误处理](/matrix/error-handling-matrix) / [可移植性](/matrix/portability-matrix)
- [Shell vs Python](/matrix/comparison/shell-vs-python)、[证据政策](/reference/evidence-policy)
