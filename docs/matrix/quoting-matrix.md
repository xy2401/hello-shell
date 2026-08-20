# 引号矩阵：单双引号语义、插值与阻止展开

> 本页结论：引号语义可以收敛成一张表——bash/zsh/fish 与 PowerShell 都是「双引号插值、单引号字面」，cmd 只有双引号且只被部分命令当引号认，python 单双等价、插值只能走 f-string。真正拉开差距的是引号之外：bash 未加引号的展开**默认分词**，zsh **默认不分词**，fish 变量天生是列表、没有分词这一步，PowerShell/cmd 字符串是标量、要拆得用 `-split` 或 `for`。只要值带上引号（或运行体根本没有展开机制），`a*b*c` 永远是字面量——任务 02 的 `starLiteral=a*b*c` 在八份快照里全票通过。

## 统一实验

任务 02 四个验证点：带空格赋值（`value`）、分词计数（`wordCount`）、插值（`interpolated`）、通配字面量（`starLiteral`）。五个 Linux 运行体快照逐字一致：

```text
# demos/bash/02_variables_quoting.sh.out.txt（demos/zsh、demos/fish、demos/pwsh、demos/python 快照逐字相同）
value=hello world
wordCount=3
interpolated=value-is-42
starLiteral=a*b*c
```

Windows 侧三份快照（`demos/cmd/02_variables_quoting.bat.out.txt`、`demos/powershell5/02_variables_quoting.ps1.out.txt`、`demos/powershell7/02_variables_quoting.ps1.out.txt`）打出逐字相同的同样四行契约值，与 Linux 侧完全一致。

## 引号六维对照

| 运行体 | 单引号语义 | 双引号语义 | 变量引用写法 | 阻止分词 | 阻止通配展开 | 转义体系 |
| --- | --- | --- | --- | --- | --- | --- |
| bash | 字面量 | 插值 `$var` | `"$var"` / `"${var}"` | 给展开加引号 | 加引号（引号内 `*` 不展开通配） | 反斜杠全家桶（`\$` `\"` `\\` 等） |
| zsh | 字面量 | 插值 `$var` | `"$var"` | 默认就**不分词**，无需阻止；要分词反而需 `${=var}` 显式开启 | 加引号 | 反斜杠，同 bash |
| fish | 字面量 | 插值 `$var`（无需 `${}`） | `"...$var..."` | 无分词概念：变量即列表，拆用 `string split` | 加引号 | 反斜杠转义集很小（`\"` `\\` `\$` 等），没有 bash 式 `\n`/`\t` 全家桶 |
| pwsh（Linux） | 字面量 | 插值 `"$var"` / `"$(表达式)"` | `$var`（字符串内直接写） | 无 shell 分词：字符串是标量，拆分靠 `-split` | 引号内的 `*` 只是字符；通配只在 cmdlet 通配参数处生效 | 反引号 `` ` `` |
| cmd | 无单引号语义（单引号只是普通字符） | 有双引号，且**仅部分命令认**；`set "VAR=value"` 用引号圈住赋值边界 | `%VAR%`（即时）/ `!VAR!`（延迟展开） | 无 shell 分词；拆词靠 `for %%w in (...)` | cmd 本无通配展开，`*` 天生是普通字符 | `^`（引号外的转义符） |
| powershell5 | 字面量 | 插值 `"$var"` | `$var` | 同 pwsh：`-split` 显式拆 | 同 pwsh | 反引号 |
| powershell7 | 字面量 | 插值 `"$var"` | `$var` | 同 pwsh | 同 pwsh | 反引号 |
| python | 与双引号完全等价 | 与单引号完全等价 | 无插号展开；插值只能用 f-string `f"...{var}"` | 不存在 shell 分词：字符串就是数据 | 不存在通配展开：`*` 是普通字符 | 反斜杠（语言层字符串转义，`\n` `\t` 有效） |

## 逐维度证据

### 双引号插值：`interpolated=value-is-42` 的五条路径

bash/zsh 直接 `"$count"` 插值（摘自 `demos/bash/02_variables_quoting.sh`）：

```bash
count=42
echo "interpolated=value-is-$count"
```

fish 同样在双引号内展开，且不需要 `${}`（摘自 `demos/fish/02_variables_quoting.fish`）：

```fish
set -l num 42
echo "interpolated=value-is-$num"
```

pwsh 双引号插值 `$answer`（摘自 `demos/pwsh/02_variables_quoting.ps1`）：

```powershell
$interpolated = "value-is-$answer"
```

cmd 没有插值语法，靠延迟展开拼串（摘自 `demos/cmd/02_variables_quoting.bat`）：

```bat
set "NUM=42"
echo interpolated=value-is-!NUM!
```

python 的「插值」是显式的 f-string（摘自 `demos/python/02_variables_quoting.py`）：

```python
print(f"interpolated=value-is-{num}")
```

五条语法路径（PowerShell 三家共用 `"$var"` 一条），八份快照统一落同一行契约输出 `interpolated=value-is-42`。

### 单引号字面量与 cmd 的例外

PowerShell 单引号是纯字面量：pwsh 脚本里 `$starLiteral = 'a*b*c'`，`$answer` 不会被代入。cmd 没有单引号语义——`'...'` 只是普通字符；它的双引号也不是「shell 级引号」，只是原样进字符串、由具体命令自行解释，所以批处理惯例是用 `set "VAR=value"` 把引号圈在赋值语句边界上（摘自 `demos/cmd/02_variables_quoting.bat`）：

```bat
set "VALUE=hello world"
echo value=!VALUE!
```

### 分词：同是 `wordCount=3`，机制五个样

这是「语法路径差异」最典型的案例：

```bash
# demos/bash/02_variables_quoting.sh —— bash 默认分词：未加引号的展开按 IFS 拆
words="a b c"
set -- $words
echo "wordCount=$#"
```

```zsh
# demos/zsh/02_variables_quoting.zsh —— zsh 默认不分词，${=var} 显式开启
words="a b c"
wordArray=( ${=words} )
echo "wordCount=${#wordArray}"
```

```fish
# demos/fish/02_variables_quoting.fish —— fish 无分词概念，显式 split 再 count
set -l wc (count (string split " " $sentence))
```

```powershell
# demos/pwsh/02_variables_quoting.ps1 —— PowerShell 字符串是标量，-split 显式拆
$wordCount = ($starLiteral -split '\*').Count
```

```bat
rem demos\cmd\02_variables_quoting.bat —— cmd 用 for 分词器数 token
for %%w in (!WORDS!) do set /a COUNT+=1
```

八份快照统一落 `wordCount=3`。bash 的 `set -- $words` 若改成 `set -- "$words"` 就只有 1 个词——这就是「引号阻止分词」的开关；zsh 默认站在关的那一侧，bash 默认站在开的那一侧。

### 阻止通配展开：引号是统一解

bash 注释直接点题（摘自 `demos/bash/02_variables_quoting.sh`）：

```bash
glob="a*b*c"  # quoted expansion: the * stays literal, no pathname expansion
echo "starLiteral=$glob"
```

fish 同理（`# quoting: a quoted '*' stays literal and is never glob-expanded`）。对 PowerShell/cmd/python 而言这题不存在——字符串里的 `*` 天生不是通配符（PowerShell 的通配只发生在 cmdlet 的通配参数位，见[通配矩阵](/matrix/globbing-matrix)）。八份快照 `starLiteral=a*b*c` 全票通过。

## 小结

| 结论 | 证据 |
| --- | --- |
| 「双插值、单字面」是 shell 界主流，cmd 与 python 是两个例外 | bash/zsh/fish/pwsh 任务 02 源码与快照；cmd 仅双引号且仅部分命令认（任务 02 快照四行与 Linux 侧逐字一致）；python 单双等价、插值走 f-string |
| 分词默认值：bash 开、zsh 关、其余无此步骤 | bash `set -- $words` 得 3 词 vs zsh `${=words}` 显式分词；`wordCount=3` 八体一致 |
| 引号内无通配 | `starLiteral=a*b*c` 八份快照逐字一致 |

延伸阅读：[变量与引号统一骨架](/fundamentals/quoting-variables)、[通配矩阵](/matrix/globbing-matrix)、[实验说明](/labs/)。
