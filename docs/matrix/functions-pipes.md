# 函数与管道：返回值通道与管道里流的东西

> 本页结论：函数有两条独立的「返回通道」——**值通道**（bash/zsh 靠 `echo` + 命令替换，PowerShell/Python 是真返回值，fish 只有退出码通道）和**退出码通道**（bash/zsh 的 `return 7` 由 `$?` 捕获、fish 由 `$status` 捕获、PowerShell 子进程由 `$LASTEXITCODE` 捕获）。任务 05 五个运行体输出一致：`functionResult=42`、`exitCodeReturn=7`、`afterCall=outer`。管道则分两个世界：POSIX 系流的是**文本行**（`cut | sort | uniq -c`），PowerShell 流的是**对象**（`Import-Csv | Group-Object`），Python 干脆没有管道、用代码替代——任务 06 三种写法得到同一份统计结果。

## 函数：两条返回通道

### 值通道：怎么把 42 交回调用者

| 运行体 | 写法 | 捕获方式 |
| --- | --- | --- |
| bash / zsh | 函数体 `echo "$total"` | `result="$(compute)"` 命令替换 |
| fish | 函数体 `return 42`（注意：这是退出码 42） | `set -l result $status` |
| PowerShell | `return 42`（真返回值） | `$result = Get-Answer` |
| Python | `return 42`（真返回值） | `result = make_answer()` |

bash/zsh 的函数没有真正的返回值，惯例是把结果打到 stdout、由调用者用 `$(...)` 接住：

```bash
# demos/bash/05_functions_scope.sh
compute() {
  local total=$((40 + 2))
  echo "$total"  # caller captures stdout via $(...)
}
functionResult="$(compute)"
```

fish 更特殊：`return 42` 返回的是**退出码**，调用者从 `$status` 读（`demos/fish/05_functions_scope.fish` 注释原话：a fish function "returns" an exit code, not a value）。退出码 0–255 的范围限制也由此而来。

### 退出码通道：统一捕获 7

任务 05 的第二个验证点：让「函数/子进程」以 7 失败，看各家怎么读这个 7。五个运行体的输出逐字一致：

```text
# demos/bash/05_functions_scope.sh.out.txt
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

（`demos/zsh/05_functions_scope.zsh.out.txt`、`demos/fish/05_functions_scope.fish.out.txt`、`demos/python/05_functions_scope.py.out.txt` 内容相同。）

机制各不相同：

- **bash/zsh**：函数内 `return 7`，调用者读 `$?`：

  ```bash
  fail_with_seven
  echo "exitCodeReturn=$?"
  ```

- **fish**：`return 7` 后读 `$status`（`set -l rc $status`）。
- **PowerShell**：函数内部的失败不等于脚本失败；演示直接起一个子 pwsh 进程 `exit 7`，父进程从 `$LASTEXITCODE` 拿到退出码：

  ```powershell
  # demos/pwsh/05_functions_scope.ps1
  & pwsh -NoProfile -Command 'exit 7'
  Write-Output "exitCodeReturn=$LASTEXITCODE"
  ```

- **Python**：`return 7` 只是普通值；要拿「退出码 7」得起子进程——`subprocess.run([...sys.exit(7)...]).returncode`。

### 作用域：局部修改不外泄

第三个验证点 `afterCall=outer`：函数内对同名变量的赋值只影响函数内部。bash/zsh 用 `local`（`local globalVar="inner"`），fish 用 `set -l`，PowerShell 函数内赋值天然创建新的局部变量，Python 同理。五份快照的第三行都是 `afterCall=outer`。

## 管道：文本流 vs 对象流 vs 代码

任务 06 有四个验证点：glob 列举（`globList`）、按扩展名计数（`logFiles=1`）、按模式数行（`requestLines=2`）、按 CSV 列分组统计（`statusCounts=paid:3,pending:1,refunded:1`）。五个运行体输出完全一致：

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

Windows 三份快照已入库：`demos/powershell5/06_pipes_files.ps1.out.txt`、`demos/powershell7/06_pipes_files.ps1.out.txt` 与上面逐字相同；`demos/cmd/06_pipes_files.bat.out.txt` 有一处真实差异——`requestLines=4` 而非 2：cmd 的 `find` 默认大小写不敏感且做子串匹配，`"request"` 里的 `st` 也会命中 `app started`/`app stopped` 两行。这是快照入库后以实测为准修正的唯一验证点。

### POSIX 文本管道：cut | sort | uniq -c

bash/zsh 把「按 status 列统计」写成一条文本流水线——跳过表头、切出第 4 列、排序、计数、格式化：

```bash
# demos/bash/06_pipes_files.sh
statusCounts="$(tail -n +2 /fixtures/orders.csv | cut -d, -f4 | sort | uniq -c | awk '{ printf "%s%s:%s", sep, $2, $1; sep = "," }')"
```

数行用 `grep -c request`（bash/zsh）或 `grep ... | wc -l`（fish：`command grep request /fixtures/data/app.log | wc -l | string trim`）。管道里流动的是**字节流**，每个工具各切一段——这是 shell 最锋利的刀，也是[任务 06](/matrix/experiment/#任务-04-控制流#任务-06-管道与文件)要反复磨的地方。

### PowerShell 对象管道：Import-Csv | Group-Object

同样一条统计，PowerShell 里管道流动的是**.NET 对象**，列名、类型都在对象身上，不需要切字段：

```powershell
# demos/pwsh/06_pipes_files.ps1
$groups = Import-Csv (Join-Path $fixtures 'orders.csv') | Group-Object status
```

其余验证点同样是 cmdlet 流水线：`Get-ChildItem | Sort-Object Name`（列举）、`Get-ChildItem -Filter *.log | Measure-Object`（通配计数）、`Select-String -Pattern 'request' | Measure-Object`（模式数行）。

### Python：没有管道，用标准库顶上

Python 版把整条管道翻译成显式代码：`sorted(os.listdir(...))`、`name.endswith(".log")`、逐行 `"request" in line`、`csv.DictReader` 加字典计数（见 `demos/python/06_pipes_files.py`）。输出与 shell 版逐字相同——这正是 [Shell vs Python](/matrix/comparison/shell-vs-python) 要讨论的边界：一行管道能搞定的事 shell 占优，一旦要维护中间状态（如 fish 版手写的计数循环），Python 的可读性就开始反超。

## 本页证据清单

| 快照 | 关键行 |
| --- | --- |
| `demos/bash/05_functions_scope.sh.out.txt`、`demos/zsh/05_functions_scope.zsh.out.txt` | `exitCodeReturn=7`（`$?` 捕获 `return 7`） |
| `demos/fish/05_functions_scope.fish.out.txt` | `exitCodeReturn=7`（`$status` 捕获）、`functionResult=42`（`return 42`） |
| `demos/pwsh/05_functions_scope.ps1.out.txt` | `exitCodeReturn=7`（子进程 `exit 7` → `$LASTEXITCODE`） |
| `demos/python/05_functions_scope.py.out.txt` | `exitCodeReturn=7`（`subprocess` 的 `returncode`） |
| `demos/bash/06_pipes_files.sh.out.txt` 等五份 06 快照 | `statusCounts=paid:3,pending:1,refunded:1` |
| `demos/cmd/05_functions_scope.bat.out.txt` | `exitCodeReturn=7`（`call :label` + `exit /b 7` → `!ERRORLEVEL!`）、`afterCall=outer`（`setlocal`/`endlocal`） |
| `demos/powershell5/05_functions_scope.ps1.out.txt`、`demos/powershell7/05_functions_scope.ps1.out.txt` | 三行与 Linux 侧逐字相同（子进程 `exit 7` → `$LASTEXITCODE`） |
| `demos/cmd/06_pipes_files.bat.out.txt` | `statusCounts=paid:3,pending:1,refunded:1`；但 `requestLines=4`（`find` 大小写不敏感子串匹配，与其余七体的 2 不同） |
| `demos/powershell5/06_pipes_files.ps1.out.txt`、`demos/powershell7/06_pipes_files.ps1.out.txt` | 四行与 Linux 侧逐字相同 |

## 延伸阅读

- [统一任务实验总览 · 任务 05](/matrix/experiment/#任务-04-控制流#任务-05-函数与作用域)、[任务 06](/matrix/experiment/#任务-04-控制流#任务-06-管道与文件)
- [错误与信号](/matrix/errors-signals)：退出码在错误模型里的位置
- [Shell vs Python](/matrix/comparison/shell-vs-python)、[可移植性矩阵](/matrix/portability-matrix)
