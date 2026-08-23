# 通配矩阵：谁来展开 `*`，无匹配怎么办，`**` 谁能递归

> 本页结论：通配展开分两个阵营——bash/zsh/fish 由 **shell 在命令执行前展开**，命令行里的 `*` 到达脚本时已是文件名列表；PowerShell/cmd 的命令行**不做通配展开**，`*` 原样传递，由 `Get-ChildItem -Filter`、`dir`、`for` 这类命令自行处理；python 根本没有 shell 层通配，需显式调用 `glob`/`os.listdir`。无匹配时的行为是最大分野：bash 把模式原样传给命令、zsh 默认直接报错（NOMATCH，可用 `(N)` 限定符改为返回空）、fish 展开为空、cmd 的 `for` 一轮都不进。递归 `**` 只有 zsh/fish 默认可用，bash 要先 `shopt -s globstar`。任务 06 的 `globList=app.log,config.csv,readme.txt` 在八份快照里逐字一致。

## 统一实验

任务 06 对 `fixtures/data`（内有 `app.log`、`config.csv`、`readme.txt` 三个文件）做通配列举与 `*.log` 计数。五个 Linux 运行体快照逐字一致：

```text
# demos/bash/06_pipes_files.sh.out.txt（demos/zsh、demos/fish、demos/pwsh、demos/python 快照逐字相同）
globList=app.log,config.csv,readme.txt
logFiles=1
requestLines=2
statusCounts=paid:3,pending:1,refunded:1
```

Windows 侧快照已入库：powershell5/powershell7 两份快照与上图逐字一致；cmd 快照的 `globList=app.log,config.csv,readme.txt`、`logFiles=1`、`statusCounts=paid:3,pending:1,refunded:1` 三行同样吻合，唯独 `requestLines=4` 偏离契约值 2——`find` 直读 LF 行尾的 fixture 时行为异常（同一脚本里经 `type` 管道中转的 `statusCounts` 仍精确）。该行不属于本矩阵的通配维度，但按快照如实记录。

## 通配四维对照

| 运行体 | 展开者 | 无匹配行为 | 递归通配 `**` | 任务 06 的通配写法 |
| --- | --- | --- | --- | --- |
| bash | **shell** 展开（命令执行前，结果按序排好） | 模式**原样**传给命令（默认未开 nullglob） | 默认不支持；需 `shopt -s globstar` 后 `**` 才递归 | `for f in /fixtures/data/*` |
| zsh | **shell** 展开（可直接进数组） | 默认**报错中止**（NOMATCH 选项）；模式后加 `(N)` 限定符可改为返回空 | **默认支持** `**` 递归 | `files=( /fixtures/data/* )` |
| fish | **shell** 展开（结果进列表） | 展开为**空**（该项直接消失，`count` 得 0） | **默认支持** `**` 递归 | `count /fixtures/data/*.log` |
| pwsh（Linux） | 命令行**不展开**；`*` 交给 cmdlet 的通配参数 | cmdlet 返回**空**结果（不报错） | 通配符本身不递归；需 `-Recurse` 参数配合 | `Get-ChildItem $dataDir -Filter *.log` |
| cmd | 命令行**不展开**；`dir`/`for` 等命令自带通配处理 | `for` 集合一轮不进（计数保持 0）；`dir` 报错并置 ERRORLEVEL | 无 `**`；递归要用 `for /r` | `for %%f in ("%DATA%\*.log")` |
| powershell5 | 同 pwsh：命令行不展开，cmdlet 通配参数处理 | 空结果不报错 | 同 pwsh：`-Recurse` | `Get-ChildItem $data -Filter *.log -File` |
| powershell7 | 同 pwsh | 空结果不报错 | 同 pwsh：`-Recurse` | `Get-ChildItem $dataDir -Filter *.log` |
| python | 无 shell 层通配；`*` 是普通字符 | 不适用——列举靠 `os.listdir`/`glob`，结果本来就是列表（可为空） | `glob.glob(pattern, recursive=True)` 显式开启 | `os.listdir(data_dir)` + `name.endswith(".log")` |

注：本仓库任务 06 的通配**总有匹配**（fixtures 固定三个文件），无匹配分支未被快照触发；「无匹配行为」一列陈述的是各运行体的既定语义（E1 官方口径），其中 cmd 行有源码内的防御性注释佐证（见下）。

## 逐维度证据

### 展开者：shell 展开阵营

bash 的 glob 在 `for` 处展开且已排好序（摘自 `demos/bash/06_pipes_files.sh`）：

```bash
for f in /fixtures/data/*; do  # glob expands in sorted order
```

zsh 把展开结果直接装进数组，再靠参数展开取基名、拼串（摘自 `demos/zsh/06_pipes_files.zsh`）：

```zsh
files=( /fixtures/data/* )
basenames=( ${files:t} )
echo "globList=${(j:,:)basenames}"
```

fish 展开进列表后计数（摘自 `demos/fish/06_pipes_files.fish`）：

```fish
echo "logFiles="(count /fixtures/data/*.log)
```

三条路径落同一行快照 `globList=app.log,config.csv,readme.txt`、`logFiles=1`。

### 展开者：命令自己展开阵营

pwsh 的命令行里没有通配展开这一步，`*.log` 是作为 `-Filter` 的字符串参数交给 `Get-ChildItem` 的（摘自 `demos/pwsh/06_pipes_files.ps1`）：

```powershell
$logFiles = (Get-ChildItem $dataDir -Filter *.log | Measure-Object).Count
```

cmd 的 `for` 文件集自带通配，脚本注释明确它是为「无匹配」场景兜底的写法（摘自 `demos/cmd/06_pipes_files.bat`）：

```bat
rem count *.log files with a file-set loop (robust when nothing matches)
set "LOGC=0"
for %%f in ("%DATA%\*.log") do set /a LOGC+=1
```

无匹配时 `for` 循环体一次都不执行，`LOGC` 保持 0——这正是 cmd 对付空匹配的方式；有匹配时快照实测 `logFiles=1`，与其余七体一致。powershell5/7 的写法与 pwsh 同构（`Get-ChildItem ... -Filter *.log`），两份快照的 `globList`、`logFiles` 行与 Linux 侧逐字相同。

python 侧连「通配符」都不存在：列举就是 `os.listdir`，过滤就是 `endswith`（摘自 `demos/python/06_pipes_files.py`）：

```python
names = sorted(os.listdir(data_dir))
log_files = sum(1 for name in names if name.endswith(".log"))
```

### 无匹配：同一模式，四种命运

同样一条「目录里没有 `*.tmp`」的假设：

- **bash**：模式 `/dir/*.tmp` 原封不动成为命令的第一个参数（默认未开 `nullglob`），收到它的命令多半报「文件不存在」。
- **zsh**：默认 `NOMATCH` 选项下直接报错 `no matches found`，命令根本不会执行；模式后加 `(N)` 限定符（如 `/dir/*.tmp(N)`）才改为返回空。
- **fish**：通配展开为空，该参数位直接消失；`count /dir/*.tmp` 得 0。
- **pwsh / cmd**：不经过 shell 展开，`Get-ChildItem` 返回空结果、`for` 集合为空，均不报错。

任务 06 未触发这些分支（fixtures 恒有匹配），以上按各运行体既定语义陈述；shell 阵营三家「有匹配时展开为何物」已由 `globList` 行实证。

### 递归通配 `**`

- zsh/fish：`**` 默认即递归（zsh 自 4.3 起、fish 一贯支持）。
- bash：`**` 默认与 `*` 无异，必须先 `shopt -s globstar`。
- PowerShell：通配符不跨目录，递归是 `-Recurse` 参数的职责（任务 06 未用递归，powershell5/7 同）。
- cmd：没有 `**`，递归遍历用 `for /r`。
- python：`glob.glob('**/*.log', recursive=True)` 显式开启。

## 小结

| 结论 | 证据 |
| --- | --- |
| bash/zsh/fish 是 shell 展开，PowerShell/cmd 是命令自展开，python 无 shell 通配 | bash `for f in /fixtures/data/*`、zsh 数组展开、fish `count` vs pwsh `-Filter`、cmd `for` 文件集、python `os.listdir`；`globList` 八体一致 |
| 无匹配：bash 原样 / zsh 报错（`(N)` 转空）/ fish 空 / PowerShell 与 cmd 空集合不报错 | 各运行体既定语义；cmd 源码注释 `robust when nothing matches`，有匹配分支由快照 `logFiles=1` 实证 |
| 递归 `**`：zsh/fish 默认、bash 需 globstar、其余走参数或 API | 同上列写法对照 |

延伸阅读：[管道与文件实验](/playground/)、[引号矩阵](/matrix/quoting-matrix)（引号如何冻结 `*`）、[Shell vs Python 边界](/matrix/comparison/shell-vs-python)。
