# bash 真实陷阱

> 本页结论：bash 的多数事故集中在三处——引号缺失引发的分词与 glob、`set -e` 并非全局保险丝、退出码只有 8 位且会被下一条命令立刻覆盖。每个陷阱都给出 `demos/bash/` 的脚本与输出证据。

## 陷阱 1：引号缺失 → 分词与 glob

未加引号的变量展开会先按 IFS 分词、再做路径名展开（glob）。`demos/bash/02_variables_quoting.sh` 用正反两面演示了这一点：

```bash
words="a b c"
set -- $words       # 未加引号：拆成 3 个位置参数
echo "wordCount=$#"

glob="a*b*c"        # 加引号：* 保持字面量
echo "starLiteral=$glob"
```

输出 `demos/bash/02_variables_quoting.sh.out.txt`：

```text
wordCount=3
starLiteral=a*b*c
```

`wordCount=3` 是分词的预期用法；但同样的规则落到文件名上就是事故——值为 `my report.txt` 的变量不加引号会拆成两个词，值里带 `*` 时还会被展开成文件列表。`03_args_parsing.sh` 的解析循环处处加引号（`case "$1"`、`positional+=("$1")`、`nValue="$2"`），输出中 `secondArg=bob smith` 完整保留，正是加引号的结果。

**规避**：展开一律加双引号；确需分词时像 demo 一样显式写出来并加注释。通用规则见 [变量与引用](/matrix/quoting-variables)。

## 陷阱 2：set -e 不是全局保险丝

`set -e` 只在「未被守护」的失败命令处终止脚本；出现在 `if`/`while` 条件、`||`/`&&` 左侧的命令失败不会触发它，且它的作用域只到当前 shell。`demos/bash/07_errors.sh` 给出证据：

```bash
false || caughtError=true   # || 守护：不触发 set -e，脚本继续
echo "afterFailure=continued"

( set -e; false )           # set -e 只作用于这个子 shell
setEExitCode=$?
```

输出 `demos/bash/07_errors.sh.out.txt`：

```text
caughtError=true
afterFailure=continued
setEExitCode=1
scriptExitCode=0
```

两个事实：`||` 右侧的兜底让失败被捕获且脚本继续（`afterFailure=continued`）；`set -e` 开启在子 shell 里，失败只终止子 shell（`setEExitCode=1`），父脚本照常走到 `scriptExitCode=0`。

**规避**：不要假设 `set -e` 覆盖一切；关键步骤显式 `cmd || exit 1` / `cmd || fallback`，子 shell 的失败要用 `$?` 主动接住。详见 [错误与信号](/matrix/errors-signals)。

## 陷阱 3：退出码只有 8 位，且 $? 立即被覆盖

bash 的退出码通道是 0–255（超界值按模 256 截断，这是 POSIX 退出码机制；本仓库 demo 均使用区间内的小值），而且 `$?` 只保存**上一条**命令的退出码——下一条命令一执行就被覆盖。两个 demo 都演示了「立即捕获」：

`demos/bash/01_hello_io.sh`：

```bash
ls /nonexistent-dir-hello-shell >/dev/null 2>&1
childExitCode=$?
echo "childExitCode=$childExitCode"
```

输出 `childExitCode=1`。`demos/bash/05_functions_scope.sh`：

```bash
fail_with_seven
echo "exitCodeReturn=$?"
```

输出 `exitCodeReturn=7`。两例都在失败命令之后的**第一条语句**就把 `$?` 存进变量——如果中间插入任何命令（哪怕 `echo`），原退出码就丢了。函数的 `return` 走的是同一条 0–255 通道，所以不能靠退出码回传大数或负数；回值要走 stdout（见 [语法骨架·函数](./syntax)）。

## 避坑清单

- 变量展开默认加双引号，分词/glob 是例外且需注释；
- `set -e` 当安全带而非自动驾驶，关键命令显式兜底；
- `$?` 立即存入变量再用；回值用 stdout，退出码只传状态；
- 管道中每一段都在子 shell 运行，需要累计变量时用 `< <(...)` 进程替换（见 [语法骨架·循环](./syntax)）。

## 相关页面

- [bash 语法骨架](./syntax)
- [bash 入参模型](./args)
- [zsh 真实陷阱](/products/zsh/pitfalls)：分词行为与 bash 相反
- [fish 真实陷阱](/products/fish/pitfalls)：POSIX 语法不兼容

## 浏览器实验

<ShellLessonTrigger case-id="pitfall-bash-quoting" label="载入未引用展开坑位" />
<ShellLessonTrigger case-id="task-07" variant="bash" label="载入 set -e 对照" />

<ShellLessonLab :case-ids="['pitfall-bash-quoting', 'task-07']" default-variant="bash" />
