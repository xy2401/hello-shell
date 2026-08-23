# Shell vs Python：什么时候该换语言

> 本页结论：Shell 是胶水——进程编排、管道组合、环境变量传参是它的母语；但入参解析、数据结构、错误模型、跨平台这四件事一复杂就处处别扭。经验分界线：约 200 行以内的一次性胶水/管道任务用 shell，越过这条线、或需要数据结构、测试与跨平台，就换 Python。

对照基准：本仓库九个统一任务各有
bash/zsh/fish/cmd/PowerShell（PS5 与 PS7）与 Python 实现；Linux 侧
（bash/zsh/fish/pwsh/python）与 Windows 侧（cmd/PS5/PS7）输出快照均已
入库，Windows 27 份由 CI 在 `windows-latest` 上采集，位于
`demos/cmd`、`demos/powershell5`、`demos/powershell7` 各脚本旁的
`.out.txt`。

## 一、Shell 顺手处

### 胶水与进程编排

启动进程、重定向流、串联退出码——这些是 shell 的原生语法，一行即达。
01 任务里 bash 捕获子进程失败只需一行：

```bash
ls /nonexistent-dir-hello-shell >/dev/null 2>&1
echo "childExitCode=$?"
```

Python 等价物要搬出 `subprocess`（摘自 `demos/python/01_hello_io.py`）：

```python
result = subprocess.run(
    ["ls", "/nonexistent-dir-hello-shell"],
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL,
)
print(f"childExitCode={result.returncode}")
```

两边输出一致（`childExitCode=2`，见
`demos/bash/01_hello_io.sh.out.txt` 与 `demos/python/01_hello_io.py.out.txt`），
但 shell 版连 import 都不需要。

### 管道组合：一行 vs 一段

06 任务统计 CSV 状态分布，bash 是一行管道（摘自
`demos/bash/06_pipes_files.sh`）：

```bash
statusCounts="$(tail -n +2 /fixtures/orders.csv | cut -d, -f4 | sort | uniq -c | awk '{ printf "%s%s:%s", sep, $2, $1; sep = "," }')"
```

Python 得手写循环维护字典（摘自 `demos/python/06_pipes_files.py`）：

```python
counts = {}
with open(os.path.join(FIXTURES, "orders.csv"), newline="") as fh:
    for row in csv.DictReader(fh):
        status = row["status"]
        counts[status] = counts.get(status, 0) + 1
```

结果相同——bash 输出与 python 输出均为
`statusCounts=paid:3,pending:1,refunded:1`。文本流 + 小工具组合是 shell
无可替代的强项（代价：`cut -d,` 的脆弱性见下节）。

### 环境即状态

环境变量 + 退出码是进程间最朴素的通信协议。本仓库所有实现都从
`HELLO_SHELL_FIXTURES`（Linux 容器内为 `/fixtures`）读取数据目录，不传
参数、不读配置文件——shell 里 `export` 一下就是全局状态，Python 则要
`os.environ` 显式接手。一次性任务里这种「环境即状态」极其省事。

## 二、Shell 别扭处

### 入参解析：五个 shell 各写一遍手工循环

03 任务解析 `alice "bob smith" --verbose -n 3`。bash 要 `while`/`case`/
`shift`，zsh/fish 各有一套等价循环，cmd 只能 `goto` + `shift`，PowerShell
得索引遍历 `$args`——五个 shell 五种方言，全是手工活；而 Python 的手工版
（`demos/python/03_args_parsing.py`）只是朴素的列表遍历，生产做法更是
十几行 `argparse` 就有类型、默认值、`--help` 与报错：

```python
parser = argparse.ArgumentParser()
parser.add_argument("names", nargs=2)
parser.add_argument("--verbose", action="store_true")
parser.add_argument("-n", type=int, default=1)
args = parser.parse_args()
```

八种实现的完整对照见 [入参矩阵](/matrix/args-matrix)。

### 字符串与数据结构：cut -d, 一碰引号就碎

bash 06 的 `cut -d, -f4` 假设「逗号就是列分隔符」——一旦 CSV 字段里
出现逗号或引号（`"Smith, Bob"`），列号整体错位。Python 的 `csv` 模块
按 RFC 规则处理引号转义，天生免疫。02 任务里 shell 还要为「字符串里带
空格」专门演示引号规则，Python 字符串则根本没有这层规则。shell 也没有
真正的数据结构：bash 数组只是字符串序列，cmd 连数组都没有，字典/嵌套
一概靠字符串硬拼。

### 错误处理：三种语义模型并存

同一个 07 任务，各家失败信号完全不同：

- bash：`$?` 退出码，可选 `set -e` 遇错即停；
- cmd：`ERRORLEVEL`，还得防延迟展开的坑；
- PowerShell：cmdlet 错误归 `$?`/异常体系，子进程才写 `$LASTEXITCODE`；
- Python：只有异常一种模型，`try/except` 统一捕获。

四份 07 快照输出口径被 demo 强行对齐成 `caughtError=true` /
`afterFailure=continued` / `setEExitCode=1` / `scriptExitCode=0`，但源码
里的机制南辕北辙。混编脚本（shell 调 python 调 cmd）时，退出码、异常、
ERRORLEVEL 三种模型的翻译损耗是真实 bug 源。对照见
[错误处理矩阵](/matrix/error-handling-matrix)。

### 跨平台：Windows 三套脚本 vs Python 一份

08 任务（复制、改名、校验）在本仓库有三份 Windows 实现
（`demos/cmd/08_real_world.bat`、`demos/powershell5/08_real_world.ps1`、
`demos/powershell7/08_real_world.ps1`）外加一份 Linux 侧 pwsh 采集脚本，
而 Python 只有 `08_real_world.py` 一份，同文件跑遍所有平台（快照
`verify=ok`）。cmd 还要额外防 CRLF 行尾与 `^` 转义，PowerShell 要防
PS5/PS7 编码差异——每多一种 shell，跨平台成本乘以一份维护量。

## 三、分界结论

- **用 shell**：一次性胶水、进程编排、管道组合、CI 里三五行的环境准备。
  退出码 + 管道 + 环境变量就是全部所需时，shell 最短。
- **换 Python**：脚本超过约 200 行、需要真正的数据结构、要写测试、
  要跨 Windows/Linux 一份代码、或入参超过「两三个位置参数」的复杂度。

### 九任务舒适度汇总

| 任务 | Shell 舒适度 | Python 舒适度 | 备注 |
| --- | --- | --- | --- |
| 00 环境探测 | 高 | 中 | `ver`/`$PSVersionTable` 一行；python 要 `platform`+`subprocess` |
| 01 stdout/stderr | 高 | 中 | 重定向是 shell 母语；python 要 `subprocess` |
| 02 变量与引号 | 中 | 高 | shell 引号规则五家方言；python 无引号规则 |
| 03 入参解析 | 低 | 高 | 五个 shell 手工循环；python 生产有 argparse |
| 04 控制流 | 中 | 高 | shell 循环方言各异且无数组；python 语法统一 |
| 05 函数与作用域 | 低 | 高 | cmd 只有 label；shell 函数靠退出码；python 返回值自然 |
| 06 管道与文件 | 高 | 中 | 一行管道 vs 手写循环；但 `cut -d,` 脆弱 |
| 07 错误处理 | 低 | 高 | 退出码/ERRORLEVEL/$? 三种模型 vs 统一异常 |
| 08 综合实战 | 中 | 高 | Windows 三套脚本 vs python 一份跨平台 |

规律很清楚：**离进程与管道越近的任务 shell 越舒服，离数据结构与
工程化越近的任务 Python 越舒服**。入门顺序与练习见 [labs](/matrix/experiment/)，
各 shell 的逐卷细节见 [cmd 分卷](/products/cmd/) 与
[PowerShell 分卷](/products/powershell/)，基础概念见
[入门指南](/guide/getting-started)。
