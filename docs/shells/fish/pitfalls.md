# fish 真实陷阱

> 本页结论：fish 的陷阱集中在三处——语法与 POSIX 不兼容，bash/zsh 脚本无法直接运行；管道段运行在子 shell 中，管道内改变量带不回来；`$status` 会被下一条命令立刻覆盖，必须即时保存。每个陷阱都有 `demos/fish/` 的脚本与输出证据。

## 陷阱 1：语法不兼容 POSIX——bash 脚本不能直接跑

fish 刻意不追随 POSIX/Bourne 语法。把 bash 脚本原样交给 fish，会在语法层面直接失败。差异清单全部有 demo 证据：

| bash/POSIX 写法 | fish 写法 | demo 证据 |
| --- | --- | --- |
| `$(cmd)` 命令替换 | `(cmd)` 括号替换 | `00_env.fish`：`set -l fish_version (fish --version \| string split \n)[1]` |
| `done` / `fi` / `esac` 收尾 | 一切块以 `end` 收尾 | `03`/`04`/`05` 全部块结构 |
| `$(( ))` 算术展开 | 内置 `math` | `04_control_flow.fish`：`set total (math $total + $i)` |
| `{1..3}` 区间展开 | 显式词表或 `seq` | `04`：`for i in 1 2 3`；`06`：`seq (count $counts)` |
| `set -e` 快速失败 | 无等价物，逐条 `if not` / `; or` | `07_errors.fish`、`08_real_world.fish` |
| `$?` 退出码 | `$status` | `01_hello_io.fish`：`set -l child_status $status` |

结论：fish 适合写「只在 fish 里跑」的工具脚本与交互配置；要跨 shell 分发的脚本请用 bash（见 [bash 分卷](/shells/bash/index)）。九个统一任务的输出在三家逐行一致（如 `paidCount=3`），证明不兼容只在语法层，不在能力层。

## 陷阱 2：管道段在子 shell 中运行，管道内改变量带不回来

fish 管道的每一段都运行在子 shell 里，`cmd | while read` 内部的 `set` 在管道结束后随之消失。`demos/fish/04_control_flow.fish` 因此**刻意不用管道**喂循环，而用文件重定向：

```fish
set -l paid 0
while read -l line
    if string match -q -- '*,paid' $line
        set paid (math $paid + 1)
    end
end < /fixtures/orders.csv
echo "paidCount=$paid"
```

输出 `paidCount=3`——计数留在了当前 shell。同一任务的另两家给出了对照写法：bash 用进程替换 `done < <(tail ...)`（[bash 语法骨架](/shells/bash/syntax)），zsh 的管道最后一段本就在当前 shell、可以直接 `tail ... | while read`（[zsh 语法骨架](/shells/zsh/syntax)）。需要命令输出喂循环时，fish 的通用解法是先捕获 `(cmd)` 再遍历，或用 `begin ... end < (cmd)` 重定向。

## 陷阱 3：$status 覆盖极快，必须立即保存

`$status` 只保存**上一条**命令的退出码——任何后续命令（哪怕一句 `echo`、一个 `test`）都会把它冲掉。三个 demo 都采用了「立即存入变量」的写法：

`demos/fish/01_hello_io.fish`：

```fish
command ls /nonexistent-dir-hello-shell >/dev/null 2>&1
set -l child_status $status
echo "childExitCode=$child_status"
```

输出 `childExitCode=1`。`demos/fish/05_functions_scope.fish` 同样在函数调用后的第一条语句就捕获：

```fish
make_answer
set -l result $status
```

输出 `functionResult=42`。`demos/fish/07_errors.fish` 对 `ls` 失败也是先 `set -l fail_status $status` 再打印，得到 `setEExitCode=1`。特别注意：`if`/`while` 的 `test` 条件本身也是命令，也会覆盖 `$status`——需要在条件判断前保存。

## 避坑清单

- 分发给他人的脚本用 bash 写；fish 脚本只为 fish 环境而写；
- 循环要累计变量时，数据经 `< 文件` 或 `(cmd)` 捕获进入，不走管道；
- `$status` 在下一条命令前存入变量；函数回值用 `echo` + 括号捕获，`return` 只传 0–255 状态；
- 从 bash 移植逻辑时，对照 [语法骨架](./syntax) 的独特处速记表逐项改写。

## 相关页面

- [fish 语法骨架](./syntax)
- [fish 入参模型](./args)
- [bash 真实陷阱](/shells/bash/pitfalls)
- [错误与信号](/fundamentals/errors-signals)
