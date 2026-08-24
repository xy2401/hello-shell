# zsh 入参模型

> 本页结论：zsh 与 bash 共用同一套入参三件套——`$0`（脚本名/调用路径）、`$#`（参数个数）、`$@`（全部位置参数），手工解析同样是 `while` + `case` + `shift` 循环；唯一要注意的差异是**数组下标从 1 开始**。本页证据来自 `demos/zsh/03_args_parsing.zsh` 与其快照。

## $0 / $# / $@

| 名字 | 含义 | demo 证据 |
| --- | --- | --- |
| `$0` | 脚本名/调用路径 | `echo "invocation=${0##*/}"` → 快照 `invocation=03_args_parsing.zsh` |
| `$#` | 位置参数个数 | `argCount=$#` → 快照 `argCount=5` |
| `$@` | 全部位置参数 | 循环里经 `"$1"` 逐个消费 |

注意：在 zsh **交互会话**里 `$0` 另有含义（指向当前执行的函数/脚本上下文），但在脚本文件中 `$0` 就是脚本路径，demo 快照为证。

## 自调用与样例参数

与 bash 版同构：无参运行时 `exec` 重新执行自己，带上固定样例参数。摘自 `demos/zsh/03_args_parsing.zsh`：

```bash
if [ "$#" -eq 0 ]; then
  exec zsh "$0" alice "bob smith" --verbose -n 3
fi
```

5 个参数：`alice`、`bob smith`（引号保住为 1 个参数）、`--verbose`、`-n`、`3`。

## while / case / shift 解析循环

解析循环与 bash 版逐行一致，差异只在最后的数组取值。摘自 `demos/zsh/03_args_parsing.zsh`：

```bash
while [ "$#" -gt 0 ]; do
  case "$1" in
    --verbose) verboseFlag=true; shift ;;
    -n)        nValue="$2"; shift 2 ;;
    *)         positional+=("$1"); shift ;;
  esac
done

echo "invocation=${0##*/}"
echo "argCount=$argCount"
# zsh arrays are 1-based (bash would use [0] and [1] here)
echo "firstArg=${positional[1]}"
echo "secondArg=${positional[2]}"
```

输出 `demos/zsh/03_args_parsing.zsh.out.txt`：

```text
invocation=03_args_parsing.zsh
argCount=5
firstArg=alice
secondArg=bob smith
verboseFlag=true
nValue=3
```

与 bash 版快照逐行一致（除脚本名后缀），但取值下标不同：bash 用 `${positional[0]}`/`${positional[1]}`，zsh 用 `${positional[1]}`/`${positional[2]}`。把 bash 脚本里的数组下标照搬到 zsh（或反向），会静默取到相邻元素——见 [真实陷阱](./pitfalls)。

## 横向对照

- [/matrix/args-matrix](/matrix/args-matrix)：八种运行体 03 任务输出并排对照；
- [bash 入参模型](/products/bash/args)：同一解析循环，数组下标从 0 开始；
- [fish 入参模型](/products/fish/args)：没有 `$0/$#`，用 `$argv` 与 `status filename`。
