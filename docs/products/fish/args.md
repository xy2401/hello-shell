# fish 入参模型

> 本页结论：fish 没有 `$0/$#/$@` 三件套——位置参数全在列表 `$argv` 里（下标从 1 开始），个数用 `count $argv`，脚本自身路径用内置函数 `status filename`。解析惯例也不是 `case`+`shift`，而是索引 `while` 循环。本页证据来自 `demos/fish/03_args_parsing.fish` 与其快照。

## $argv 与 status filename

| bash/zsh | fish | demo 证据 |
| --- | --- | --- |
| `$0`（脚本名/路径） | `status filename` | `set -l script_name (string replace -r '.*/' '' (status filename))` → 快照 `invocation=03_args_parsing.fish` |
| `$#`（参数个数） | `count $argv` | `echo "argCount="(count $argv)` → 快照 `argCount=5` |
| `$@`（全部位置参数） | `$argv`（列表，下标从 1 开始） | 循环里经 `$argv[$i]` 逐个消费 |

fish 的位置参数列表**不含脚本名**——脚本名要单独问 `status filename`。`string replace -r '.*/' ''` 用内置正则替换去掉目录前缀，等价于 bash 的 `${0##*/}`。

## 自调用与样例参数

无参运行时同样重新执行自己。fish 没有 `"$0"`，重执行靠 `status filename`。摘自 `demos/fish/03_args_parsing.fish`：

```fish
if test (count $argv) -eq 0
    # no args: re-exec self with a fixed argument list (quoted arg, flags, option with value)
    exec fish (status filename) alice "bob smith" --verbose -n 3
end
```

`(status filename)` 是括号命令替换——fish 里函数调用的结果就这样嵌进命令行。5 个样例参数与 bash/zsh 版完全一致。

## 索引 while 循环解析（fish 没有 shift）

fish 没有 `case`（等价物是 `switch`）也不走 `shift` 惯用法，demo 用索引变量驱动 `while` 循环。摘自 `demos/fish/03_args_parsing.fish`：

```fish
set -l verbose false
set -l n_value ""
set -l positional
set -l i 1
while test $i -le (count $argv)
    set -l arg $argv[$i]
    if test "$arg" = "--verbose"
        set verbose true
    else if test "$arg" = "-n"
        set i (math $i + 1)
        set n_value $argv[$i]
    else
        set -a positional $arg
    end
    set i (math $i + 1)
end
```

要点：

- 布尔旗标 `--verbose`：置位即可，索引步进由循环尾统一处理；
- 带值选项 `-n`：先 `set i (math $i + 1)` 前移索引再取 `$argv[$i]`，等价于 bash 的 `shift 2`；
- 其余参数 `set -a positional $arg` 追加进列表，`"bob smith"` 因引用保持为一个元素。

输出 `demos/fish/03_args_parsing.fish.out.txt`：

```text
invocation=03_args_parsing.fish
argCount=5
firstArg=alice
secondArg=bob smith
verboseFlag=true
nValue=3
```

与 bash/zsh 快照逐行一致（除脚本名后缀）；取值用 `$positional[1]`/`$positional[2]`——fish 列表与 zsh 数组一样从 1 开始。

## 横向对照

- [/matrix/args-matrix](/matrix/args-matrix)：八种运行体 03 任务输出并排对照；
- [bash 入参模型](/products/bash/args)：`$0/$#/$@` 与 case/shift 循环；
- [zsh 入参模型](/products/zsh/args)：同用 `$0/$#/$@`，数组下标同样从 1 开始。

## 浏览器实验

<ShellLessonTrigger case-id="task-03" variant="fish" label="载入 Fish 入参解析" />

<ShellLessonLab :case-ids="['task-03']" default-variant="fish" />
