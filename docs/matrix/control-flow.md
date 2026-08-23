# 控制流：条件、循环与遍历

> 本页结论：条件与循环的语法各家差异极大，但语义高度收敛——任务 04 的三个验证点在全部八个运行体上输出逐字相同：`sum123=6`、`paidCount=3`、`loopFiles=3`（Windows 三份快照已入库）。统一模型是三件事：条件判断（命令退出码或布尔表达式）、循环（枚举集合或读流）、遍历（glob、cmdlet 还是标准库 API）。差异点集中在坑位：zsh 的 `status` 是保留字、bash 管道尾段跑在子 shell 里计不了数。

## 统一模型

| 子问题 | POSIX shell（bash/zsh） | fish | PowerShell | Python |
| --- | --- | --- | --- | --- |
| 条件 | `if [ ... ]` / `if cmd`（看退出码） | `if cmd` / `if test` | `if (表达式)`（布尔值） | `if 表达式:` |
| 枚举循环 | `for i in ...` | `for i in ...` | `foreach ($x in ...)` | `for x in ...:` |
| 读流循环 | `while read -r ...` | `while read -l ...` | `foreach` 对象集合 | `for row in csv.DictReader(fh)` |
| 目录遍历 | glob：`for f in dir/*` | glob：`for f in dir/*` | `Get-ChildItem` | `os.listdir` |

任务 04 用三个验证点覆盖这三类结构：

1. `sum123`：`for` 循环对 1..3 求和；
2. `paidCount`：逐行读 `orders.csv`，按第 4 列 `status` 过滤 `paid`；
3. `loopFiles`：遍历 `/fixtures/data/` 下的文件计数。

## 证据：五个运行体输出逐字一致

```text
# demos/bash/04_control_flow.sh.out.txt
sum123=6
paidCount=3
loopFiles=3
```

```text
# demos/fish/04_control_flow.fish.out.txt
sum123=6
paidCount=3
loopFiles=3
```

```text
# demos/pwsh/04_control_flow.ps1.out.txt
sum123=6
paidCount=3
loopFiles=3
```

zsh 与 Python 的快照（`demos/zsh/04_control_flow.zsh.out.txt`、`demos/python/04_control_flow.py.out.txt`）内容与上面三份完全相同。同一份 fixture（`orders.csv` 共 5 行数据：3 条 `paid`、1 条 `pending`、1 条 `refunded`；`data/` 目录 3 个文件），五种写法数出同样的结果。

## 同一条 CSV，三种读法

`paidCount=3` 这个点最能体现「语法不同、模型不同、结论相同」：

**bash——`while read` 加字段切分。** 用进程替换跳过表头，按逗号把每行切成四个变量：

```bash
# demos/bash/04_control_flow.sh
while IFS=, read -r orderId customer amount orderStatus; do
  if [ "$orderStatus" = "paid" ]; then
    paidCount=$((paidCount + 1))
  fi
done < <(tail -n +2 /fixtures/orders.csv)
```

**fish——内置字符串匹配，不起 grep 子进程：**

```fish
# demos/fish/04_control_flow.fish
while read -l line
    if string match -q -- '*,paid' $line
        set paid (math $paid + 1)
    end
end < /fixtures/orders.csv
```

**PowerShell——行变对象，按属性过滤：**

```powershell
# demos/pwsh/04_control_flow.ps1
foreach ($order in Import-Csv (Join-Path $fixtures 'orders.csv')) {
    if ($order.status -eq 'paid') {
        $paidCount += 1
    }
}
```

Python 则用 `csv.DictReader` 按列名取值（`row["status"] == "paid"`），输出同为 `paidCount=3`。

## 两个跨 shell 坑位

**坑一：bash 的管道尾段在子 shell 里。** 如果 bash 写成 `tail ... | while read ...`，循环体跑在子 shell，`paidCount` 的修改不会带回当前 shell——所以 bash 版用了进程替换 `< <(...)` 让 `while` 留在当前 shell。zsh 恰好相反：管道**最后一段**默认在当前 shell 运行，所以 zsh 版直接写管道也没事（源码注释原话：in zsh the pipeline's last segment runs in the current shell, so paidCount survives）。

**坑二：zsh 里 `status` 是保留字。** zsh 的 `status` 是 `$?` 的只读别名，不能拿来当循环变量名——所以各 shell 版本统一把字段命名为 `orderStatus`。PowerShell 与 Python 没有这个限制，直接用 CSV 列名 `status`（`$order.status`、`row["status"]`）。这类「同一个词在不同 shell 里身份不同」的坑，集中在各分卷的 pitfalls 页（如 [zsh pitfalls](/products/zsh/pitfalls)）。

## glob 遍历：同一形态，不同实现

`loopFiles=3` 的遍历写法：bash/zsh/fish 都用 glob（`for f in /fixtures/data/*`），PowerShell 用 `Get-ChildItem`，Python 用 `os.listdir`。glob 在控制流里的角色（展开成词表供循环消费）与它在[变量与引号](/matrix/quoting-variables)里的行为是同一套机制。

## 本页证据清单

| 快照 | 关键行 |
| --- | --- |
| `demos/bash/04_control_flow.sh.out.txt` | `sum123=6` / `paidCount=3` / `loopFiles=3` |
| `demos/zsh/04_control_flow.zsh.out.txt` | 同上 |
| `demos/fish/04_control_flow.fish.out.txt` | 同上 |
| `demos/pwsh/04_control_flow.ps1.out.txt` | 同上 |
| `demos/python/04_control_flow.py.out.txt` | 同上 |
| `demos/cmd/04_control_flow.bat.out.txt` | 同上三行（`for /l` 求和、`for /f` 读 CSV；含 echo 回显行） |
| `demos/powershell5/04_control_flow.ps1.out.txt`、`demos/powershell7/04_control_flow.ps1.out.txt` | 同上三行，与 Linux 侧逐字相同 |

## 延伸阅读

- [统一任务实验总览 · 任务 04](/playground/#任务-04-控制流#任务-04-控制流)
- [变量与引号](/matrix/quoting-variables)（glob 展开规则）、[函数与管道](/matrix/functions-pipes)（管道子 shell 与对象管道）
- [Shell vs Python](/matrix/comparison/shell-vs-python)：当过滤逻辑复杂到要维护状态时，为什么该换 Python
