# bash 语法骨架

> 本页结论：bash 脚本由六块积木组成——变量与引用、条件、循环、函数、管道、错误处理。本页每个片段均摘自 `demos/bash/` 下的真实脚本，每段输出均摘自同名 `*.out.txt` 快照；bash 的独特之处在于 `$( )` 命令替换、`$?` 退出码、`set -e` 快速失败与 `< <(...)` 进程替换。

## 变量与引用

赋值号两侧不能有空格；双引号内插值；**未加引号的展开会按 IFS 分词**；加引号的展开不做分词与 glob。摘自 `demos/bash/02_variables_quoting.sh`：

```bash
value="hello world"
echo "value=$value"

# bash splits an unquoted expansion on IFS whitespace: "a b c" -> 3 words.
words="a b c"
set -- $words
echo "wordCount=$#"

glob="a*b*c"  # quoted expansion: the * stays literal, no pathname expansion
echo "starLiteral=$glob"
```

输出 `demos/bash/02_variables_quoting.sh.out.txt`：

```text
value=hello world
wordCount=3
interpolated=value-is-42
starLiteral=a*b*c
```

`set -- $words` 未加引号，`a b c` 被拆成 3 个位置参数，故 `wordCount=3`；`"$glob"` 加了引号，`*` 保持字面量。引用与分词的通用规则见 [变量与引用](/concepts/quoting-variables)。

## 条件

bash 的条件就是命令：`[ ]`（即 `test`）与 `case`。摘自 `demos/bash/04_control_flow.sh`：

```bash
if [ "$orderStatus" = "paid" ]; then
  paidCount=$((paidCount + 1))
fi
```

分支匹配用 `case`，摘自 `demos/bash/03_args_parsing.sh`：

```bash
case "$1" in
  --verbose) verboseFlag=true; shift ;;
  -n)        nValue="$2"; shift 2 ;;
  *)         positional+=("$1"); shift ;;
esac
```

注意两处都引用了变量（`"$orderStatus"`、`"$1"`），原因见 [真实陷阱](./pitfalls)。控制流的统一语义见 [控制流](/concepts/control-flow)。

## 循环

三种常见形态：按词表 for、按行 while read、glob 遍历文件。摘自 `demos/bash/04_control_flow.sh`：

```bash
sum123=0
for i in 1 2 3; do
  sum123=$((sum123 + i))
done

paidCount=0
while IFS=, read -r orderId customer amount orderStatus; do
  if [ "$orderStatus" = "paid" ]; then
    paidCount=$((paidCount + 1))
  fi
done < <(tail -n +2 /fixtures/orders.csv)
```

输出 `demos/bash/04_control_flow.sh.out.txt`：

```text
sum123=6
paidCount=3
loopFiles=3
```

`paidCount=3` 与 fixtures 中 3 笔 paid 订单一致。这里用了 bash 独特的**进程替换** `< <(...)`：把 `tail` 的输出喂给 `while` 循环，同时让循环留在当前 shell——若写成 `tail ... | while read`，循环体会落进子 shell，`paidCount` 带不出来（zsh 没有这个问题，见 [zsh 语法骨架](/products/zsh/syntax)）。

## 函数

bash 函数有两条回传通道：**stdout 回值**（调用方用 `$( )` 捕获），**退出码回状态**（调用方读 `$?`）；`local` 屏蔽作用域。摘自 `demos/bash/05_functions_scope.sh`：

```bash
compute() {
  local total=$((40 + 2))
  echo "$total"  # caller captures stdout via $(...)
}

fail_with_seven() {
  return 7  # exit-code channel, not text
}

functionResult="$(compute)"
fail_with_seven
echo "exitCodeReturn=$?"
```

输出 `demos/bash/05_functions_scope.sh.out.txt`：

```text
functionResult=42
exitCodeReturn=7
afterCall=outer
```

`afterCall=outer` 证明函数内 `local globalVar="inner"` 只遮蔽函数内部，调用返回后全局值不受影响。详见 [函数与管道](/concepts/functions-pipes)。

## 管道

用外部工具链做文本统计：跳过表头、切列、排序、计数、整形。摘自 `demos/bash/06_pipes_files.sh`：

```bash
export LC_ALL=C  # deterministic sort order

statusCounts="$(tail -n +2 /fixtures/orders.csv | cut -d, -f4 | sort | uniq -c | awk '{ printf "%s%s:%s", sep, $2, $1; sep = "," }')"
echo "statusCounts=$statusCounts"
```

输出 `demos/bash/06_pipes_files.sh.out.txt`：

```text
globList=app.log,config.csv,readme.txt
logFiles=1
requestLines=2
statusCounts=paid:3,pending:1,refunded:1
```

`LC_ALL=C` 锁定排序规则，保证 `globList` 与 `statusCounts` 在任何机器上输出一致——这是「可复现快照」的前提。

## 错误处理

bash 默认**不因失败而中断**：失败命令只是留下非零退出码，脚本继续跑。兜底用 `||`，快速失败用 `set -e`。摘自 `demos/bash/07_errors.sh`：

```bash
caughtError=false
false || caughtError=true  # failure is caught; the script keeps running
echo "afterFailure=continued"

( set -e; false )  # set -e makes the subshell stop at the first failure
setEExitCode=$?
echo "setEExitCode=$setEExitCode"
```

输出 `demos/bash/07_errors.sh.out.txt`：

```text
caughtError=true
afterFailure=continued
setEExitCode=1
scriptExitCode=0
```

`set -e` 只杀掉了开启它的那个子 shell（退出码 1 被父 shell 用 `$?` 接住），父脚本自己走到 `scriptExitCode=0`。`set -e` 的盲区见 [真实陷阱](./pitfalls)；错误处理的统一模型见 [错误与信号](/concepts/errors-signals)。

## bash 独特处速记

| 独特处 | demo 证据 |
| --- | --- |
| `$( )` 命令替换 | `00_env.sh`：`version="$(bash --version \| head -n 1)"` |
| `$?` 读上一条命令退出码 | `01_hello_io.sh`：`ls /nonexistent...` 后立即 `childExitCode=$?`，快照给出 `childExitCode=1` |
| `set -e` 快速失败 | `07_errors.sh`：子 shell 内首错即停，`setEExitCode=1` |
| `< <(...)` 进程替换 | `04_control_flow.sh`：保住 `paidCount=3` 不落入管道子 shell |
| 数组下标从 0 开始 | `03_args_parsing.sh`：`firstArg=${positional[0]}`（zsh 从 1 开始，见 [zsh 卷](/products/zsh/syntax)） |

## 相关页面

- [bash 入参模型](./args)
- [bash 真实陷阱](./pitfalls)
- [/matrix/args-matrix](/matrix/args-matrix)：八种运行体的入参差异横向对照
