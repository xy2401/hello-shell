# bash 入参模型

> 本页结论：bash 的入参三件套是 `$0`（脚本名/调用路径）、`$#`（参数个数）、`$@`（全部位置参数）；带空格的参数必须加引号才能保持为一个词；工程上惯用 `while` + `case` + `shift` 手工解析。本页证据全部来自 `demos/bash/03_args_parsing.sh` 与其快照 `demos/bash/03_args_parsing.sh.out.txt`。

## $0 / $# / $@

| 名字 | 含义 | demo 证据 |
| --- | --- | --- |
| `$0` | 脚本名/调用路径 | `echo "invocation=${0##*/}"` → 快照 `invocation=03_args_parsing.sh` |
| `$#` | 位置参数个数 | `argCount=$#` → 快照 `argCount=5` |
| `$@` | 全部位置参数 | 循环里经 `"$1"` 逐个消费（`$@` 加引号时按参数原样展开） |

采集器以 `bash /demos/03_args_parsing.sh` 启动脚本，所以 `$0` 是完整路径；`${0##*/}` 是 bash 参数展开的「去目录留文件名」惯用法。

## 自调用与样例参数

无参运行时，脚本用 `exec` 重新执行自己并带上一组固定样例参数（含引号参数、布尔旗标、带值选项），摘自 `demos/bash/03_args_parsing.sh`：

```bash
if [ "$#" -eq 0 ]; then
  exec bash "$0" alice "bob smith" --verbose -n 3
fi
```

5 个参数：`alice`、`bob smith`（因加引号仍是 1 个参数）、`--verbose`、`-n`、`3`。

## while / case / shift 解析循环

bash 没有内置的选项解析器，标准做法是 `while` 循环配合 `case` 分支与 `shift` 消耗参数。摘自 `demos/bash/03_args_parsing.sh`：

```bash
verboseFlag=false
nValue=""
positional=()
while [ "$#" -gt 0 ]; do
  case "$1" in
    --verbose)
      verboseFlag=true
      shift
      ;;
    -n)
      nValue="$2"
      shift 2
      ;;
    *)
      positional+=("$1")
      shift
      ;;
  esac
done
```

要点：

- 布尔旗标 `--verbose`：置位后 `shift` 消耗 1 个参数；
- 带值选项 `-n`：值在 `$2`，`shift 2` 一次消耗选项与其值；
- 其余参数进数组，`positional+=("$1")` 的引号保证 `bob smith` 不被拆词。

输出 `demos/bash/03_args_parsing.sh.out.txt`：

```text
invocation=03_args_parsing.sh
argCount=5
firstArg=alice
secondArg=bob smith
verboseFlag=true
nValue=3
```

`secondArg=bob smith` 完整保留了空格——这正是 `"$1"` 加引号的效果；数组取值用 `${positional[0]}`、`${positional[1]}`（bash 下标从 0 开始）。

## 横向对照

同一任务在其他运行体里的入参模型各不相同（脚本名是否占位、位置参数起点、带空格参数如何保持）：

- [/matrix/args-matrix](/matrix/args-matrix)：八种运行体 03 任务输出并排对照；
- [zsh 入参模型](/products/zsh/args)：同样用 `$0/$#/$@`，但数组下标从 1 开始；
- [fish 入参模型](/products/fish/args)：没有 `$0/$#`，用 `$argv` 与 `status filename`。

## 浏览器实验

<ShellLessonTrigger case-id="task-03" variant="bash" label="载入 Bash 入参解析" />

<ShellLessonLab :case-ids="['task-03']" default-variant="bash" />
