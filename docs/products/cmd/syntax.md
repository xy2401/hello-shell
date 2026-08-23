# cmd 语法基础

> 本页结论：cmd 脚本的标准开场是 `@echo off` + `setlocal EnableDelayedExpansion`；变量有 `%VAR%`（解析期展开）与 `!VAR!`（延迟展开）两套写法；读文件/命令输出靠 `for /f`；模拟函数靠 `call :label` + `exit /b`；判断成败看 `ERRORLEVEL`。所有片段摘自 `demos/cmd/`。

## 开场四件套：@echo off 与 setlocal

几乎每个正经的 `.bat` 都以下面两行开头（摘自 `demos/cmd/00_env.bat`）：

```bat
@echo off
setlocal EnableDelayedExpansion
```

- `echo off`：关闭命令回显，否则每行命令执行前都会先打印一遍；前缀
  `@` 让这一行本身也不回显。
- `setlocal`：把后续的环境变量修改限制在脚本内，退出时自动还原，
  相当于给脚本加了一层作用域。
- `EnableDelayedExpansion`：启用 `!VAR!` 延迟展开——没有它，
  `for` 循环体里就读不到刚修改的变量值（详见 [常见陷阱](/products/cmd/pitfalls)）。

## 变量：set 赋值与两种展开时机

赋值推荐 `set "VAR=value"` 写法，引号包住整体，值里的空格和尾部字符都安全
（摘自 `demos/cmd/02_variables_quoting.bat`）：

```bat
rem quoted assignment keeps the space inside the value
set "VALUE=hello world"
echo value=!VALUE!
```

读取变量有两种写法，区别在**展开时机**：

| 写法 | 展开时机 | 用途 |
| --- | --- | --- |
| `%VALUE%` | 整行（整个括号块）被解析时一次性替换 | 脚本顶层的静态引用 |
| `!VALUE!` | 命令真正执行时 | 循环体、`if` 块内读最新值 |

`for` 循环里累加计数必须用 `!VAR!`（摘自 `demos/cmd/02_variables_quoting.bat`）：

```bat
set "COUNT=0"
for %%w in (!WORDS!) do set /a COUNT+=1
echo wordCount=!COUNT!
```

`%%w` 是批处理中 `for` 变量的写法（交互命令行里是单个 `%w`）；
`set /a` 是算术赋值。`echo interpolated=value-is-!NUM!` 输出
`interpolated=value-is-42`——快照证实
（`demos/cmd/02_variables_quoting.bat.out.txt` 第 5 行）。

## for /f：读文件与命令输出

`for /f` 是 cmd 里唯一顺手的「逐行读取 + 分列」工具。按列统计 CSV
（摘自 `demos/cmd/04_control_flow.bat`）：

```bat
rem scan orders.csv, skip the header, count rows whose 4th column is paid
set "PAID=0"
for /f "usebackq skip=1 tokens=4 delims=," %%s in ("%FIXTURES%\orders.csv") do (
    if "%%s"=="paid" set /a PAID+=1
)
echo paidCount=!PAID!
```

要点：`skip=1` 跳过表头；`tokens=4 delims=,` 取第 4 列；
`usebackq` 让带引号的路径按文件名处理（否则会被当成字面字符串）。

读**命令输出**则把命令放进单引号（摘自 `demos/cmd/00_env.bat`）：

```bat
for /f "delims=" %%v in ('ver') do set "VERSION_LINE=%%v"
```

`delims=` 置空表示整行保留、不分词。另有 `for /l %%i in (1,1,3)` 数值
范围循环和 `for %%f in ("dir\*")` 文件集循环，见 04/06 两个脚本。

## call :label 子例程：cmd 的「函数」

cmd 没有函数，用标签 + `call` 模拟（摘自 `demos/cmd/05_functions_scope.bat`）：

```bat
call :get_answer
echo functionResult=!RESULT!
rem exit /b N sets ERRORLEVEL seen by the caller
call :fail_routine
echo exitCodeReturn=!ERRORLEVEL!
exit /b 0

:get_answer
set "RESULT=42"
exit /b 0

:fail_routine
exit /b 7
```

规则：

- `call :label` 跳转到标签执行，遇到 `exit /b` 返回调用点；
- **没有返回值**，只能借环境变量（如 `RESULT`）传结果；
- `exit /b N` 设置调用方可见的 `ERRORLEVEL`，相当于「返回码」；
- 子例程里再套一层 `setlocal`/`endlocal` 可以让变量修改不外泄
  （见 `:set_scope`）。

## ERRORLEVEL：命令的退出码

`ERRORLEVEL` 是上一条命令的退出码，cmd 世界的成败判断全靠它
（摘自 `demos/cmd/07_errors.bat`）：

```bat
dir "%FIXTURES%\no-such-dir" >nul 2>nul
if !ERRORLEVEL! neq 0 set "CAUGHT=true"
```

注意两点：这里必须写 `!ERRORLEVEL!` 而不是 `%ERRORLEVEL%`（展开时机问题，
见 [常见陷阱](/products/cmd/pitfalls)）；`exit /b 0` 则是脚本自身向调用方
交出的退出码。错误模型的横向对照见
[错误处理矩阵](/matrix/error-handling-matrix)。
