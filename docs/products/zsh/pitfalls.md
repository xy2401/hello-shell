# zsh 真实陷阱

> 本页结论：zsh 的陷阱几乎全部来自「它像 bash 但不是 bash」——默认不分词会让照搬的 bash 分词逻辑静默失效；数组下标从 1 开始会取错元素；`status` 是保留字不能当普通变量；未匹配的 glob 默认直接报错，需要 `(N)` 限定符兜底。每个陷阱都有 `demos/zsh/` 的脚本与输出证据。

## 陷阱 1：默认不分词——照搬 bash 的分词写法会静默失效

bash 里 `for w in $var` 会按空白拆词，zsh 里 `$var` 不加修饰符**始终是一个词**。`demos/zsh/02_variables_quoting.zsh` 演示了 zsh 的正确姿势：

```bash
words="a b c"
wordArray=( ${=words} )       # ${=var} 显式开启分词
echo "wordCount=${#wordArray}"
```

输出 `wordCount=3`。如果按 bash 习惯写成依赖隐式分词的逻辑，在 zsh 里不会报错，只会默默把 `"a b c"` 当成一个整体处理——这类静默错误比报错更难查。反过来说，bash 里「忘加引号导致拆词」的事故（见 [bash 真实陷阱](/products/bash/pitfalls)）在 zsh 里天然不存在。

## 陷阱 2：数组下标从 1 开始

zsh 数组是 1-based，bash 是 0-based。同一份解析结果，两边取值写法不同，摘自 `demos/zsh/03_args_parsing.zsh`：

```bash
# zsh arrays are 1-based (bash would use [0] and [1] here)
echo "firstArg=${positional[1]}"
echo "secondArg=${positional[2]}"
```

输出 `firstArg=alice`、`secondArg=bob smith`。bash 版同一位置写的是 `${positional[0]}`/`${positional[1]}`（见 [bash 入参模型](/products/bash/args)）。跨 shell 移植脚本时，下标不改会取到相邻元素且不报错。

## 陷阱 3：status 是保留字，不能当普通变量名

在 zsh 中 `status` 是 `$?` 的只读别名（POSIX 遗留命名），给它赋值会失败。`demos/zsh/04_control_flow.zsh` 因此在读取 CSV 时刻意避开了这个名字：

```bash
# Note: the field is NOT named "status"
# here - in zsh `status` is a reserved read-only name (alias of $?).
tail -n +2 /fixtures/orders.csv | while IFS=, read -r orderId customer amount orderStatus; do
  ...
```

CSV 表头里的列名恰恰是 `status`（见 `demos/shared/fixtures/orders.csv`），脚本把读入变量命名为 `orderStatus`，输出 `paidCount=3` 正常。若直接写 `read -r orderId customer amount status`，在 zsh 里会撞上保留字而 bash 不会——同一份脚本两个 shell 行为不同的典型案例。

## 陷阱 4：NOMATCH——未匹配的 glob 默认报错，用 (N) 兜底

bash 的 glob 无匹配时把模式原样保留（`for f in *.log` 拿到字面量 `*.log`），zsh 默认开启 `NOMATCH`，**直接报错中止命令**。zsh 的答案是 glob 限定符 `(N)`（nullglob：无匹配则展开为空）。摘自 `demos/zsh/08_real_world.zsh`：

```bash
files=( /tmp/work/data/*(N.) )   # (N)=nullglob, (.)=regular files

for f in /tmp/work/data/*.log(N); do
  mv "$f" "$f.bak"
  ...
done

# after the rename no *.log may remain (N) keeps an empty match from being an error in zsh
leftovers=( /tmp/work/data/*.log(N) )
```

改名完成后 `*.log` 已无匹配，正是 `(N)` 让校验步骤安全通过，输出 `demos/zsh/08_real_world.zsh.out.txt` 给出 `verify=ok`。bash 版同一任务靠 `[ -f "$f" ]` 逐一遍历兜底（见 [bash 语法骨架](/products/bash/syntax)），两家写法再次分岔。

## 避坑清单

- 需要分词就显式写 `${=var}`，不要假设 bash 的隐式分词；
- 跨 bash/zsh 移植时全量检查数组下标（0-based vs 1-based）；
- 不要把 `status` 用作变量名，改用如 `orderStatus`、`exit_code`；
- 允许为空的 glob 一律加 `(N)`，只数普通文件再加 `(.)`。

## 相关页面

- [zsh 语法骨架](./syntax)
- [zsh 入参模型](./args)
- [bash 真实陷阱](/products/bash/pitfalls)
- [错误与信号](/matrix/errors-signals)
