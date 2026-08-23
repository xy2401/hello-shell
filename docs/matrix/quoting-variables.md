# 变量与引号：赋值、引用、插值、分词与 glob

> 本页结论：变量模型可以统一成一条流水线——赋值 → 存储 → 引用（插值或字面量）→ 分词 → glob。八个运行体在这条流水线上各有默认值：bash 对未加引号的展开**默认分词**，zsh **默认不分词**（需 `${=var}` 显式开启）；PowerShell 单引号是字面量、双引号才插值；Python 字符串根本不经过分词和 glob。只要引用时带引号（或语言本身无展开机制），含 `*` 的值就永远是字面量。任务 02 在全部八个运行体上的四个验证点输出一致，Windows 侧（cmd/PowerShell 5/PowerShell 7）快照已入库。

## 统一模型

任何 shell 处理一个变量，都经过同样五步：

1. **赋值**：`name=value`（bash/zsh）、`set -l name value`（fish）、`$name = value`（PowerShell）、`set "NAME=value"`（cmd）、`name = value`（Python）。
2. **存储**：标量字符串是公约数；列表/数组各家用各家的语法。
3. **引用**：展开变量时，是插值进字符串，还是保持字面？
4. **分词**：展开结果遇到空白会不会被拆成多个词？
5. **glob**：展开结果里的 `*` `?` `[...]` 会不会被替换成文件名？

任务 02（[统一任务实验](/matrix/experiments#任务-02-变量与引号)）用四个验证点钉住这条流水线：`value`（带空格赋值）、`wordCount`（分词）、`interpolated`（插值）、`starLiteral`（glob 字面量）。

## 证据：任务 02 输出八体一致

以下快照逐字摘自 `demos/`（八个运行体输出完全相同，这里各引一份关键行）：

```text
# demos/bash/02_variables_quoting.sh.out.txt
value=hello world
wordCount=3
interpolated=value-is-42
starLiteral=a*b*c
```

```text
# demos/zsh/02_variables_quoting.zsh.out.txt
value=hello world
wordCount=3
interpolated=value-is-42
starLiteral=a*b*c
```

```text
# demos/pwsh/02_variables_quoting.ps1.out.txt
value=hello world
wordCount=3
interpolated=value-is-42
starLiteral=a*b*c
```

输出一致，**不代表机制相同**——机制差异恰恰藏在源码里。

## bash 默认分词 vs zsh 默认不分词

两个 shell 都得到 `wordCount=3`，但路径相反：

bash 里，未加引号的展开会按 `IFS` 空白**默认分词**，所以直接展开就能拆词：

```bash
# demos/bash/02_variables_quoting.sh
words="a b c"
set -- $words        # 未加引号展开：bash 默认分词，"a b c" -> 3 个词
echo "wordCount=$#"
```

zsh 里，未加引号的展开**不分词**（这是 zsh 与 bash 最著名的差异之一），必须用 `${=var}` 显式选择分词：

```zsh
# demos/zsh/02_variables_quoting.zsh
words="a b c"
wordArray=( ${=words} )   # ${=var} 显式开启分词；zsh 数组下标从 1 开始
echo "wordCount=${#wordArray}"
```

两份输出都是 `wordCount=3`（见上方快照），但写 bash 脚本时要防「意外分词」，写 zsh 脚本时要记得「想要分词得显式开」。fish 的变量天然是列表，不存在标量分词问题；cmd 用 `for %%w in (!WORDS!)` 做词法切分，快照（`demos/cmd/02_variables_quoting.bat.out.txt`）同为 `wordCount=3`。横向对照见[引号矩阵](/matrix/quoting-matrix)。

## 单引号与双引号：PowerShell 与 Python

PowerShell 的引号语义是「单引号字面、双引号插值」：

```powershell
# demos/pwsh/02_variables_quoting.ps1
$interpolated = "value-is-$answer"   # 双引号：$answer 被插值成 42
$starLiteral = 'a*b*c'                # 单引号：原样字面量
```

对应输出（摘自 `demos/pwsh/02_variables_quoting.ps1.out.txt`）：

```text
interpolated=value-is-42
starLiteral=a*b*c
```

Python 没有「展开」这一步，字符串就是字符串；插值由 f-string 显式完成，`*` 永远只是字符：

```python
# demos/python/02_variables_quoting.py
print(f"interpolated=value-is-{num}")   # f-string 是 Python 对 "$var" 插值的回应
star = "a*b*c"                          # '*' 只是字符，不存在 glob 展开
```

对应输出（摘自 `demos/python/02_variables_quoting.py.out.txt`）：`interpolated=value-is-42`、`starLiteral=a*b*c`。

fish 双引号内变量直接展开（`echo "interpolated=value-is-$num"`），输出同为 `interpolated=value-is-42`（摘自 `demos/fish/02_variables_quoting.fish.out.txt`）。

## 含 `*` 的变量不触发 glob

任务 02 的第四个验证点：值为 `a*b*c` 的变量，引用时**不**被展开成文件名。

- bash/zsh：`glob="a*b*c"` 之后 `echo "starLiteral=$glob"`——**带引号的展开**不做路径名展开，`*` 保持字面（输出 `starLiteral=a*b*c`）。危险的是未加引号的展开：`echo $glob` 在 bash 中会尝试匹配文件。
- fish：同理，`set -l star "a*b*c"` 后引用不展开（注释原话：a quoted '*' stays literal and is never glob-expanded）。
- PowerShell：单引号字面量 `'a*b*c'` 不是通配符；需要通配时要显式走 `-Filter`、`-Path` 等参数（见任务 06 的 `Get-ChildItem -Filter *.log`）。
- Python：语言层面根本没有 glob 展开，`glob` 模块是显式调用的 API。
- cmd：`set "STAR=a*b*c"` 后 `!STAR!` 保持字面，cmd 本身不做 glob 展开（快照关键行 `starLiteral=a*b*c`，见 `demos/cmd/02_variables_quoting.bat.out.txt`）。

通配展开的详细对照（含各 shell 对不匹配 glob 的处理）见[通配矩阵](/matrix/globbing-matrix)。

## 本页证据清单

| 快照 | 关键行 |
| --- | --- |
| `demos/bash/02_variables_quoting.sh.out.txt` | `wordCount=3`（默认分词）、`starLiteral=a*b*c` |
| `demos/zsh/02_variables_quoting.zsh.out.txt` | `wordCount=3`（`${=words}` 显式分词） |
| `demos/fish/02_variables_quoting.fish.out.txt` | `interpolated=value-is-42` |
| `demos/pwsh/02_variables_quoting.ps1.out.txt` | 单双引号语义（`starLiteral=a*b*c`） |
| `demos/python/02_variables_quoting.py.out.txt` | f-string 插值、无 glob |
| `demos/cmd/02_variables_quoting.bat.out.txt` | `wordCount=3`（`for` 分词）、`starLiteral=a*b*c`（含 echo 回显行） |
| `demos/powershell5/02_variables_quoting.ps1.out.txt`、`demos/powershell7/02_variables_quoting.ps1.out.txt` | 四行与 Linux 侧逐字相同（`-split` 计数、单引号字面量） |

## 延伸阅读

- [引号矩阵](/matrix/quoting-matrix)、[通配矩阵](/matrix/globbing-matrix)
- [统一任务实验总览 · 任务 02](/matrix/experiments#任务-02-变量与引号)
- 各 shell 引号细节：[bash](/products/bash/syntax)、[zsh](/products/zsh/syntax)、[fish](/products/fish/syntax)、[cmd](/products/cmd/syntax)、[PowerShell](/products/powershell/syntax)
