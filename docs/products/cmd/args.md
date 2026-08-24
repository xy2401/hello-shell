# cmd 入参解析

> 本页结论：cmd 的入参模型保留了 DOS 时代的原始形态——`%0` 是脚本名，`%1..%9` 九个位置参数，`%*` 是整串原文，`shift` 逐个挪位，`%~1` 去引号；没有命名参数、没有参数数组，超过 9 个参数只能靠 `shift` 循环硬啃。

## %0 与 %1..%9：九个位置参数

| 变量 | 含义 |
| --- | --- |
| `%0` | 脚本自身（调用时用的路径/名字）；注意 `shift` 会连带改写它，见下文 |
| `%1` … `%9` | 第 1～9 个参数 |
| `%*` | 全部参数拼成的一串原文 |

只有九个编号槽位，**没有 `%10`**——第十个参数必须先 `shift` 才能轮到
`%9` 的位置上。这就是 cmd 入参模型的全部设施：无命名参数、无默认值、
无类型、无数组。

## %~1：去引号修饰符

Windows 上带空格的路径/参数必须加引号传递，取用时再用 `~` 剥掉外层
引号（摘自 `demos/cmd/03_args_parsing.bat`）：

```bat
set "FIRST=%~1"
set "SECOND=%~2"
```

传入 `alice "bob smith"` 时，`%~2` 得到不带引号的 `bob smith`。
`~` 家族还有路径变体：`%~f0` 是脚本自身的完整绝对路径，脚本自调用时
用得上：

```bat
if "%~1"=="" (
    call "%~f0" alice "bob smith" --verbose -n 3
    exit /b !ERRORLEVEL!
)
```

这段 re-exec 逻辑与 bash/zsh/fish/PowerShell/Python 各版 03 完全对齐：
无参时带上同一组示例参数重新执行自己。

## shift：唯一的多参数处理手段

`shift` 把所有参数左移一位（`%1` 变 `%0` 的内容、`%2` 变 `%1`……），
于是一切「遍历参数」都写成 `shift` 循环。解析
`alice "bob smith" --verbose -n 3`（摘自 `demos/cmd/03_args_parsing.bat`）：

```bat
:loop
if "%~1"=="" goto done
if "%~1"=="--verbose" set "VERBOSE=true"
if "%~1"=="-n" goto getn
set /a ARGC+=1
shift
goto loop
:getn
set /a ARGC+=1
shift
set "NVAL=%~1"
set /a ARGC+=1
shift
goto loop
:done
```

注意细节：`-n` 分支要先 `shift` 再取 `%~1` 才能拿到选项的值 `3`；
`goto` 跳出的循环全靠标签手工控制，没有 `while`/`break` 可写。

实测快照（`demos/cmd/03_args_parsing.bat.out.txt` 第 3～8 行）：

```text
invocation=3
argCount=5
firstArg=alice
secondArg=bob smith
verboseFlag=true
nValue=3
```

注意首行：按源码推演原本预期 `invocation=03_args_parsing.bat`，快照却是
`3`——这正是 cmd 入参模型的一个暗坑。脚本在 shift 循环**之后**才
`echo invocation=%~nx0`，而 cmd 的 `shift` 挪动 `%1..%9` 的同时会把
`%1` 复制进 `%0`（官方文档：shift 改变 `%0` 到 `%9` 的值），五次 shift
之后 `%0` 已经变成最后一个参数 `3`。教训：要报告脚本名，必须在进入
shift 循环之前就把 `%~nx0` 存进变量。

同一组入参，其余七种实现的快照逐行一致且 `invocation` 均为脚本名
（仅后缀不同），如 `demos/bash/03_args_parsing.sh.out.txt`：

```text
invocation=03_args_parsing.sh
argCount=5
firstArg=alice
secondArg=bob smith
verboseFlag=true
nValue=3
```

唯独 cmd 因 `%0` 被 shift 冲掉而输出 `invocation=3`，这是八种实现里
唯一的分叉点。

## 原始性小结

| 能力 | bash | PowerShell | cmd |
| --- | --- | --- | --- |
| 参数数组 | `"$@"` | `$args` | 无，仅 `%1..%9` + `%*` |
| 脚本名 | `$0` | `$PSCommandPath` | `%0` |
| 遍历 | `while`/`case`/`shift` | 索引/`while` 遍历 `$args` | 只能 `shift` + `goto` 循环 |
| 去引号 | 引号在入参前已消化 | 入参即字符串 | 需 `%~1` 手工剥 |
| 命名参数 | 无（手工解析） | `param()` 块 | 无 |

超过 9 个参数的场景在 cmd 里必须全程 `shift` 循环；选项带值（`-n 3`）
要自己处理「吃下一个参数」。八种实现的逐列对照见
[入参矩阵](/matrix/args-matrix)，动手复现见 [统一任务实验](/matrix/experiments)。

## 浏览器实验

<ShellLessonTrigger case-id="task-03" variant="cmd" label="载入 CMD 入参解析" />

<ShellLessonLab :case-ids="['task-03']" default-variant="cmd" />
