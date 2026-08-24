# fish 语法骨架

> 本页结论：fish 的六块积木（变量与引用、条件、循环、函数、管道、错误处理）一个不少，但写法自成体系——没有 `$( )`，命令替换用括号 `( )`；没有 `VAR=x` 赋值，一切变量用 `set`；没有 `$?`，退出码读 `$status`；没有 `done`/`esac`，所有块以 `end` 收尾。本页片段均摘自 `demos/fish/` 下的真实脚本，输出摘自同名 `*.out.txt` 快照。

## 变量与引用：一切皆 set，一切皆列表

fish 用 `set` 命令管理变量：`-l` 局部、`-a` 追加；变量本质是列表；双引号内直接插值，无需 `${}`。命令替换不用 `$( )`，直接用括号。摘自 `demos/fish/00_env.fish` 与 `demos/fish/02_variables_quoting.fish`：

```fish
set -l fish_version (fish --version | string split \n)[1]
echo "version=$fish_version"
set -l platform (string lower (uname -s))
```

```fish
set -l value "hello world"
echo "value=$value"
set -l sentence "$value fish"
set -l wc (count (string split " " $sentence))
echo "wordCount=$wc"
set -l star "a*b*c"   # 引号里的 * 永远是字面量，不做 glob
echo "starLiteral=$star"
```

输出 `demos/fish/02_variables_quoting.fish.out.txt`：

```text
value=hello world
wordCount=3
interpolated=value-is-42
starLiteral=a*b*c
```

注意 `(fish --version | string split \n)[1]`：括号子命令输出按行成为列表，`[1]` 直接取第一项——fish 列表下标从 1 开始。fish 内置 `string`、`count`、`math` 等命令，替代了大量外部 `sed/awk/wc` 组合。通用引用规则见 [变量与引用](/matrix/quoting-variables)。

## 条件：if test 与 string match

fish 的 `if` 直接接命令，命令成功为真；判断用内置 `test` 与 `string match`，块以 `end` 收尾。摘自 `demos/fish/04_control_flow.fish`：

```fish
while read -l line
    if string match -q -- '*,paid' $line
        set paid (math $paid + 1)
    end
end < /fixtures/orders.csv
```

`string match -q` 静默匹配通配模式，一行顶掉 bash 里的 `grep`/`case`。`if not` 捕获失败命令，摘自 `demos/fish/07_errors.fish`：

```fish
if not run_fails
    set caught true
end
```

控制流的统一语义见 [控制流](/matrix/control-flow)。

## 循环：for/while 都以 end 收尾

摘自 `demos/fish/04_control_flow.fish`：

```fish
set -l total 0
for i in 1 2 3
    set total (math $total + $i)
end
echo "sum123=$total"

set -l n 0
for f in /fixtures/data/*
    set n (math $n + 1)
end
echo "loopFiles=$n"
```

输出 `demos/fish/04_control_flow.fish.out.txt`：

```text
sum123=6
paidCount=3
loopFiles=3
```

两点 fish 特色：算术不用 `$(( ))`，用内置 `math`；计数循环的数据来自**文件重定向** `< /fixtures/orders.csv` 而不是管道——fish 的管道段运行在子 shell 中，管道里 `while read` 内部的 `set` 带不回父 shell（见 [真实陷阱](./pitfalls)）。bash 用进程替换、zsh 直接接管道、fish 用重定向：同一任务三种写法，是三家管道语义差异的直接证据。

## 函数：function/end，return 回退出码

fish 函数用 `function ... end` 定义；`return` 回传的是**退出码**（0–255），不是文本；要回值就 `echo` 后用括号捕获。作用域用 `set -l`。摘自 `demos/fish/05_functions_scope.fish`：

```fish
function make_answer
    return 42  # a fish function "returns" an exit code, not a value
end
make_answer
set -l result $status
echo "functionResult=$result"

function set_scope_demo
    set -l afterCall inner  # -l stays inside the function
end
set -l afterCall outer
set_scope_demo
echo "afterCall=$afterCall"
```

输出 `demos/fish/05_functions_scope.fish.out.txt`：

```text
functionResult=42
exitCodeReturn=7
afterCall=outer
```

与 bash/zsh 版的 `functionResult=42`、`exitCodeReturn=7`、`afterCall=outer` 逐行一致：回值走 stdout、回状态走退出码、局部变量不泄漏，这一函数模型三家通用。详见 [函数与管道](/matrix/functions-pipes)。

## 管道与文件

glob 直接可用且排序稳定；管道照旧，但常配合内置 `string` 收尾。摘自 `demos/fish/06_pipes_files.fish`：

```fish
set -l names (for f in /fixtures/data/*; basename $f; end | sort)
echo "globList="(string join , $names)

echo "logFiles="(count /fixtures/data/*.log)

set -l requests (command grep request /fixtures/data/app.log | wc -l | string trim)
```

输出 `demos/fish/06_pipes_files.fish.out.txt`：

```text
globList=app.log,config.csv,readme.txt
logFiles=1
requestLines=2
statusCounts=paid:3,pending:1,refunded:1
```

`(count /fixtures/data/*.log)` 用内置 `count` 直接数 glob 结果；`(for ... end | sort)` 展示了 fish 的特色——块也能塞进命令替换里接管道。`statusCounts` 一行由纯内置命令（`string split`/`math`/列表索引）手工聚合完成，对照 bash 版的 `cut | sort | uniq -c | awk` 外部管线（见 [bash 语法骨架](/products/bash/syntax)），是两种哲学的并排展示。

## 错误处理：失败不中断，if not / ; or 捕获

fish 与 bash 一样默认不因失败中止，也没有 `set -e`；捕获失败用 `if not` 或 `; or`。摘自 `demos/fish/07_errors.fish` 与 `demos/fish/08_real_world.fish`：

```fish
if not run_fails
    set caught true
end

command ls /nonexistent-dir-hello-shell >/dev/null 2>&1
set -l fail_status $status
echo "afterFailure=continued"
echo "setEExitCode=$fail_status"
```

```fish
test -f /tmp/work/data/app.log.bak; or set verify fail
test -e /tmp/work/data/app.log; and set verify fail
```

输出 `demos/fish/07_errors.fish.out.txt`：

```text
caughtError=true
afterFailure=continued
setEExitCode=1
scriptExitCode=0
```

`$status` 必须在失败命令后**立即**存入变量——下一条命令一执行就被覆盖，见 [真实陷阱](./pitfalls)。统一模型见 [错误与信号](/matrix/errors-signals)。

## fish 独特处速记

| 独特处 | demo 证据 |
| --- | --- |
| 无 `$( )`，命令替换用括号 `( )` | `00_env.fish`：`set -l fish_version (fish --version \| string split \n)[1]` |
| 变量全靠 `set`（`-l` 局部、`-a` 追加） | `02_variables_quoting.fish`、`03_args_parsing.fish` 通篇 `set` |
| 列表下标从 1 开始 | `00_env.fish` 的 `[1]`、`03_args_parsing.fish` 的 `$argv[$i]` |
| 退出码读 `$status`，且覆盖极快 | `01_hello_io.fish`：`set -l child_status $status` → `childExitCode=1` |
| 一切块以 `end` 收尾（无 done/esac/fi） | `03`/`04`/`05` 全部块结构 |
| 内置 `string`/`math`/`count` 替代外部工具链 | `04`：`string match -q`、`math`；`06`：`count`、`string join` |
| `command` 前缀强制走外部命令 | `01`/`06`/`07`：`command ls`、`command grep` |

## 相关页面

- [fish 入参模型](./args)
- [fish 真实陷阱](./pitfalls)
- [/matrix/args-matrix](/matrix/args-matrix)：八种运行体的入参差异横向对照

## 浏览器实验

以下案例会预载到 container2wasm；页面不会自动执行脚本。

<ShellLessonTrigger case-id="task-02" variant="fish" label="载入变量与引号" />
<ShellLessonTrigger case-id="task-04" variant="fish" label="载入控制流" />
<ShellLessonTrigger case-id="task-06" variant="fish" label="载入管道与文件" />

<ShellLessonLab :case-ids="['task-02', 'task-04', 'task-06']" default-variant="fish" />
