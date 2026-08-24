# zsh 语法骨架

> 本页结论：zsh 的六块积木（变量与引用、条件、循环、函数、管道、错误处理）与 bash 大体同构，九个统一任务的输出也与 bash 完全一致；差异集中在变量展开默认不分词、数组下标从 1 开始、glob 支持限定符这三点。本页片段均摘自 `demos/zsh/` 下的真实脚本，输出摘自同名 `*.out.txt` 快照。

## 变量与引用：默认不分词

与 bash 相反，zsh 对未加引号的展开**不做分词**；需要分词时用 `${=var}` 显式开启。数组下标从 1 开始。摘自 `demos/zsh/02_variables_quoting.zsh`：

```bash
value="hello world"
echo "value=$value"

# zsh does NOT word-split unquoted expansions (unlike bash); ${=var} opts in,
# and zsh arrays are 1-based: words[1]="a" words[2]="b" words[3]="c".
words="a b c"
wordArray=( ${=words} )
echo "wordCount=${#wordArray}"

glob="a*b*c"  # quoted expansion: the * stays literal, no filename generation
echo "starLiteral=$glob"
```

输出 `demos/zsh/02_variables_quoting.zsh.out.txt`：

```text
value=hello world
wordCount=3
interpolated=value-is-42
starLiteral=a*b*c
```

bash 版同一任务用 `set -- $words` 得到 3 个位置参数，zsh 版则必须 `${=words}` 显式分词再装进数组，用 `${#wordArray}` 取长度——结果同为 `wordCount=3`，路径完全不同。引用通用规则见 [变量与引用](/matrix/quoting-variables)。

## 条件

`[ ]`/`test` 与 `case` 的写法与 bash 一致，摘自 `demos/zsh/04_control_flow.zsh` 与 `03_args_parsing.zsh`：

```bash
if [ "$orderStatus" = "paid" ]; then
  paidCount=$((paidCount + 1))
fi
```

```bash
case "$1" in
  --verbose) verboseFlag=true; shift ;;
  -n)        nValue="$2"; shift 2 ;;
  *)         positional+=("$1"); shift ;;
esac
```

控制流的统一语义见 [控制流](/matrix/control-flow)。

## 循环：管道尾部落回当前 shell

for 循环支持 `{1..3}` 区间写法；`while read` 直接接管道即可累计变量——zsh 管道的**最后一段运行在当前 shell**。摘自 `demos/zsh/04_control_flow.zsh`：

```bash
sum123=0
for i in {1..3}; do
  sum123=$((sum123 + i))
done

paidCount=0
# skip the header with tail; in zsh the pipeline's last segment runs in the
# current shell, so paidCount survives.
tail -n +2 /fixtures/orders.csv | while IFS=, read -r orderId customer amount orderStatus; do
  if [ "$orderStatus" = "paid" ]; then
    paidCount=$((paidCount + 1))
  fi
done
```

输出 `demos/zsh/04_control_flow.zsh.out.txt`：

```text
sum123=6
paidCount=3
loopFiles=3
```

`paidCount=3` 从管道里带了回来。同样的任务，bash 版必须改用进程替换 `< <(...)` 才能保住计数（见 [bash 语法骨架](/products/bash/syntax)），fish 版改用文件重定向（见 [fish 语法骨架](/products/fish/syntax)）——同一任务三种写法，是三家管道语义差异的直接证据。

## 函数

与 bash 完全同构：stdout 回值、退出码回状态、`local` 屏蔽作用域。`demos/zsh/05_functions_scope.zsh` 与 bash 版逐行一致：

```bash
compute() {
  local total=$((40 + 2))
  echo "$total"  # caller captures stdout via $(...)
}

fail_with_seven() {
  return 7  # exit-code channel, not text
}
```

输出同为 `functionResult=42`、`exitCodeReturn=7`、`afterCall=outer`（`demos/zsh/05_functions_scope.zsh.out.txt`）。详见 [函数与管道](/matrix/functions-pipes)。

## 管道与文件：glob 直接进数组

zsh 可以把 glob 结果直接装进数组，再用修饰符与参数展开整形，免去 bash 版的手工拼接。摘自 `demos/zsh/06_pipes_files.zsh`：

```bash
export LC_ALL=C  # deterministic sort order

# glob result goes straight into an array (sorted); :t maps to basenames, (j:,:) joins
files=( /fixtures/data/* )
basenames=( ${files:t} )
echo "globList=${(j:,:)basenames}"

logs=( /fixtures/data/*.log )
echo "logFiles=${#logs}"
```

外部命令管线与 bash 相同：`tail -n +2 ... | cut -d, -f4 | sort | uniq -c | awk ...` 得到

```text
globList=app.log,config.csv,readme.txt
logFiles=1
requestLines=2
statusCounts=paid:3,pending:1,refunded:1
```

（`demos/zsh/06_pipes_files.zsh.out.txt`）`${files:t}` 取 basename，`${(j:,:)...}` 用逗号 join，`${#logs}` 数长度——bash 里需要一个 for 循环完成的事。

## 错误处理

行为与 bash 一致：默认不中断，`||` 兜底，`set -e` 管当前 shell。`demos/zsh/07_errors.zsh` 与 bash 版逐行一致，输出同为：

```text
caughtError=true
afterFailure=continued
setEExitCode=1
scriptExitCode=0
```

统一模型见 [错误与信号](/matrix/errors-signals)。

## zsh 独特处速记

| 独特处 | demo 证据 |
| --- | --- |
| 默认不分词，`${=var}` 显式分词 | `02_variables_quoting.zsh`：`wordArray=( ${=words} )` → `wordCount=3` |
| 数组下标从 1 开始 | `03_args_parsing.zsh`：`firstArg=${positional[1]}`、`secondArg=${positional[2]}`（bash 用 [0]/[1]） |
| glob 限定符 `(N)`/`(.)` | `08_real_world.zsh`：`files=( /tmp/work/data/*(N.) )`，`(N)`=无匹配时展开为空而非报错，`(.)`=只要普通文件 |
| `(j:,:)` join、`:t` basename 等展开修饰符 | `06_pipes_files.zsh`：`globList=${(j:,:)basenames}` |
| 管道最后一段在当前 shell 运行 | `04_control_flow.zsh`：`tail ... \| while read` 后 `paidCount=3` 仍在 |
| `status` 是保留字 | `04_control_flow.zsh` 刻意把字段命名为 `orderStatus`，见 [真实陷阱](./pitfalls) |

## 相关页面

- [zsh 入参模型](./args)
- [zsh 真实陷阱](./pitfalls)
- [/matrix/args-matrix](/matrix/args-matrix)：八种运行体的入参差异横向对照

## 浏览器实验

以下案例会预载到 container2wasm；页面不会自动执行脚本。

<ShellLessonTrigger case-id="task-02" variant="zsh" label="载入变量与引号" />
<ShellLessonTrigger case-id="task-04" variant="zsh" label="载入控制流" />
<ShellLessonTrigger case-id="task-06" variant="zsh" label="载入管道与文件" />

<ShellLessonLab :case-ids="['task-02', 'task-04', 'task-06']" default-variant="zsh" />
