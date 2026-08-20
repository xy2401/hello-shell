# cmd 常见陷阱

> 本页结论：cmd 的坑集中在五处——`%ERRORLEVEL%` 不启用延迟展开就读到旧值；带空格路径不加引号当场断词；没有函数只有 label，返回值靠环境变量；脚本必须 CRLF 行尾；`echo` 遇到 `& | < > ^` 等特殊字符要转义。

## 陷阱一：ERRORLEVEL 要延迟展开

`%VAR%` 在**整行（或整个括号块）解析时**就被替换成当时的值。下面这种
写法读到的是旧值：

```bat
dir "%FIXTURES%\no-such-dir" >nul 2>nul
if "%ERRORLEVEL%" neq 0 set "CAUGHT=true"   rem 单行尚且可行
(
    dir /b "%FIXTURES%\no-such-dir" >nul 2>nul
    if "%ERRORLEVEL%" neq 0 set "CAUGHT=true"   rem 坑：%ERRORLEVEL% 在进入块前已展开
)
```

括号块里的 `%ERRORLEVEL%` 在进入块之前就被替换完毕，`dir` 的失败根本
反映不出来。正确做法是 `setlocal EnableDelayedExpansion` 后写
`!ERRORLEVEL!`（摘自 `demos/cmd/07_errors.bat`）：

```bat
dir "%FIXTURES%\no-such-dir" >nul 2>nul
if !ERRORLEVEL! neq 0 set "CAUGHT=true"
```

同理，循环体内读自己刚 `set` 的变量也必须用 `!VAR!`。这也是本仓库所有
cmd demo 第一行都开 `EnableDelayedExpansion` 的原因。

## 陷阱二：空格路径必须带引号

cmd 按空格断词，`C:\Program Files\xxx.exe` 不加引号会被拆成两条参数。
两处固定写法：

```bat
rem 赋值：引号包住整体，值可以含空格
set "WORK=%TEMP%\hello-shell-work"
rem 使用：路径整体加引号
if exist "%WORK%" rd /s /q "%WORK%"
dir /b "%FIXTURES%\no-such-dir" >nul 2>nul
```

`for /f` 读带引号的文件路径还要加 `usebackq`，否则引号里的路径被当成
字面字符串（摘自 `demos/cmd/04_control_flow.bat`）：

```bat
for /f "usebackq skip=1 tokens=4 delims=," %%s in ("%FIXTURES%\orders.csv") do ...
```

## 陷阱三：没有函数，只有 label

cmd 没有函数、没有返回值，只有 `call :label` 子例程，结果只能借环境
变量传出来（摘自 `demos/cmd/05_functions_scope.bat`）：

```bat
call :get_answer
echo functionResult=!RESULT!
...
:get_answer
set "RESULT=42"
exit /b 0
```

连带两个坑：

- 「返回值」其实是副作用——`RESULT` 是全局可见的环境变量，子例程里
  忘了 `setlocal` 就会污染外部状态（对照 `:set_scope` 的
  `setlocal`/`endlocal` 包法）；
- 标签在文件里是**平铺**的，主逻辑末尾必须 `exit /b` 或 `goto :eof`，
  否则会「掉进」第一个子例程继续执行。

## 陷阱四：行尾必须是 CRLF

cmd 的行解析器认 `\r\n`。把 `.bat` 存成 LF 行尾（例如在 Linux 上编辑后
直接提交），轻则回显异常，重则标签识别错乱：`goto` 找不到目标、括号块
提前断裂，报错信息还往往指向无关行号。本仓库 `demos/cmd/*.bat` 一律以
CRLF 入库；跨平台协作时建议用 `.gitattributes` 固定 `*.bat text eol=crlf`。

## 陷阱五：echo 与特殊字符转义

`&`、`&&`、`|`、`<`、`>`、`^`、`%` 对 cmd 都有语法含义，直接出现在
文本里会被解释。转义符是 `^`：

```bat
echo pipe: ^|   amp: ^&   caret: ^^
```

常见翻车现场：

- `echo a | b`：`|` 成了真管道，`b` 被当成命令执行；
- `echo 100%%`：`%` 的转义规则与 `^` 不同，批处理里要写双 `%%`；
- `echo.` 用来打印空行（`echo` 单独一行会打印 `ECHO 处于打开状态`）。

含 `&` 的管道拼接在 demo 里也出现过，`for /f` 读命令输出时同样要转义
（摘自 `demos/cmd/06_pipes_files.bat`）：

```bat
for /f %%c in ('find "request" "%DATA%\app.log" ^| find /c /v ""') do set "REQC=%%c"
```

## 小结

| 陷阱 | 一句话对策 |
| --- | --- |
| ERRORLEVEL 读旧值 | 开延迟展开，写 `!ERRORLEVEL!` |
| 空格路径断词 | `set "VAR=..."`、路径整体加引号、`usebackq` |
| 无函数 | `call :label` + 环境变量传值 + `exit /b` 收尾 |
| LF 行尾 | CRLF 入库，`.gitattributes` 锁定 |
| echo 特殊字符 | `^` 转义，`%%` 打百分号，`echo.` 打空行 |

错误处理与入参两处的深坑另见 [常见陷阱之外的错误模型对照](/matrix/error-handling-matrix)
与 [入参矩阵](/matrix/args-matrix)；cmd 语法全貌见 [语法基础](/shells/cmd/syntax)。
